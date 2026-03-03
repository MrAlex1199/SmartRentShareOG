import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Notification, NotificationDocument } from '../notifications/schemas/notification.schema';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { LineNotifyService } from '../notifications/line-notify.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(
        private readonly messagesService: MessagesService,
        private readonly lineNotifyService: LineNotifyService,
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        @InjectModel('User') private userModel: Model<any>,
    ) { }

    /** GET /messages/:bookingId — โหลดประวัติ chat */
    @Get(':bookingId')
    async getMessages(@Param('bookingId') bookingId: string, @Request() req: any) {
        return this.messagesService.getMessages(bookingId, req.user.userId);
    }

    /** PATCH /messages/:bookingId/read — มาร์คข้อความว่าอ่านแล้ว */
    @Patch(':bookingId/read')
    async markAsRead(@Param('bookingId') bookingId: string, @Request() req: any) {
        const count = await this.messagesService.markAsRead(bookingId, req.user.userId);
        return { markedRead: count };
    }

    /** POST /messages/:bookingId — ส่งข้อความ (REST fallback เมื่อ socket ไม่ได้เชื่อมต่อ) */
    @Post(':bookingId')
    async sendMessage(
        @Param('bookingId') bookingId: string,
        @Body('content') content: string,
        @Request() req: any,
    ) {
        const senderId = req.user.userId;
        const msg = await this.messagesService.createMessage(bookingId, senderId, content);

        // Send in-app notification + LINE to the other participant (fire-and-forget)
        this.sendChatNotification(bookingId, senderId, content, msg).catch(() => { });

        return msg;
    }

    private async sendChatNotification(
        bookingId: string,
        senderId: string,
        content: string,
        msg: any,
    ) {
        try {
            const booking = await this.messagesService.assertAccess(bookingId, senderId);
            const renterId = booking.renter._id?.toString() ?? booking.renter.toString();
            const ownerId = booking.owner._id?.toString() ?? booking.owner.toString();
            const recipientId = senderId === renterId ? ownerId : renterId;
            const senderName = msg?.sender?.displayName ?? 'ผู้ใช้';
            const itemTitle = booking.item?.title ?? 'สินค้า';
            const preview = content.slice(0, 60) + (content.length > 60 ? '...' : '');

            // 1. Save in-app notification to DB
            await new this.notificationModel({
                user: new Types.ObjectId(recipientId),
                type: NotificationType.CHAT_MESSAGE,
                title: `💬 ${senderName}`,
                message: `"${preview}" — ${itemTitle}`,
                booking: new Types.ObjectId(bookingId),
                isRead: false,
            }).save();

            // 2. Send LINE push
            const recipient = await this.userModel.findById(recipientId).select('lineId');
            if (recipient?.lineId) {
                await this.lineNotifyService.notifyOwnerNewChatMessage(recipient.lineId, {
                    senderName,
                    itemTitle,
                    messagePreview: preview,
                    bookingId,
                });
            }
        } catch {
            // ignore — don't fail the REST response
        }
    }
}
