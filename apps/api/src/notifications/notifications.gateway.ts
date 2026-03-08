import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessagesService } from '../messages/messages.service';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationType } from './schemas/notification.schema';
import { LineNotifyService } from './line-notify.service';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle() // WebSocket connections bypass HTTP rate limiting
@WebSocketGateway({
    cors: {
        origin: ['https://localhost:3005', 'http://localhost:3005', process.env.FRONTEND_URL || '*'],
        credentials: true,
    },
    namespace: '/',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private userSockets = new Map<string, Set<string>>();

    constructor(
        private jwtService: JwtService,
        private messagesService: MessagesService,
        private lineNotifyService: LineNotifyService,
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        @InjectModel('User') private userModel: Model<any>,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) { client.disconnect(); return; }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
            this.userSockets.get(userId)!.add(client.id);

            client.join(`user:${userId}`);
            client.data.userId = userId;
            this.logger.log(`User ${userId} connected (socket: ${client.id})`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.userId;
        if (userId) {
            this.userSockets.get(userId)?.delete(client.id);
            if (this.userSockets.get(userId)?.size === 0) {
                this.userSockets.delete(userId);
                // Broadcast offline status to all booking rooms this user is in
                client.rooms.forEach(room => {
                    if (room.startsWith('booking:')) {
                        this.server.to(room).emit('user_status', { userId, online: false });
                    }
                });
            }
        }
    }

    /** Check if a user is currently online */
    isUserOnline(userId: string): boolean {
        return (this.userSockets.get(userId)?.size ?? 0) > 0;
    }

    // ─── Notification push (used by NotificationsService) ───────
    sendNotificationToUser(userId: string, payload: any) {
        this.server.to(`user:${userId}`).emit('notification', payload);
    }

    @SubscribeMessage('mark_read')
    handleMarkRead(client: Socket, notificationId: string) {
        client.emit('mark_read_ack', { notificationId });
    }

    // ─── Chat ────────────────────────────────────────────────────

    @SubscribeMessage('join_booking')
    async handleJoinBooking(
        @MessageBody() bookingId: string,
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data?.userId;
        client.join(`booking:${bookingId}`);
        client.emit('joined_booking', { bookingId });

        // Tell everyone in the room this user is online
        if (userId) {
            this.server.to(`booking:${bookingId}`).emit('user_status', { userId, online: true });
        }
    }

    @SubscribeMessage('send_message')
    async handleSendMessage(
        @MessageBody() payload: { bookingId: string; content: string },
        @ConnectedSocket() client: Socket,
    ) {
        const senderId = client.data?.userId;
        if (!senderId) return;

        try {
            // 1. Save message to DB
            const msg = await this.messagesService.createMessage(
                payload.bookingId,
                senderId,
                payload.content,
            );

            // 2. Broadcast to everyone in the booking room
            this.server.to(`booking:${payload.bookingId}`).emit('new_message', msg);

            // 3. Push chat notification directly (save to DB + emit via socket)
            const booking = await this.messagesService.assertAccess(payload.bookingId, senderId);
            const renterId = booking.renter._id?.toString() ?? booking.renter.toString();
            const ownerId = booking.owner._id?.toString() ?? booking.owner.toString();
            const recipientId = senderId === renterId ? ownerId : renterId;
            const senderName = (msg as any).sender?.displayName ?? 'ผู้ใช้';
            const itemTitle = booking.item?.title ?? 'สินค้า';
            const preview = payload.content.slice(0, 60) + (payload.content.length > 60 ? '...' : '');

            // Save notification to DB
            const notification = await new this.notificationModel({
                user: new Types.ObjectId(recipientId),
                type: NotificationType.CHAT_MESSAGE,
                title: `💬 ${senderName}`,
                message: `"${preview}" — ${itemTitle}`,
                booking: new Types.ObjectId(payload.bookingId),
                isRead: false,
            }).save();

            // Push via socket to recipient's personal room
            this.server.to(`user:${recipientId}`).emit('notification', {
                _id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                bookingId: payload.bookingId,
                isRead: false,
                createdAt: notification.createdAt,
            });

            // Send LINE push notification to recipient (fire-and-forget)
            this.userModel.findById(recipientId).select('lineId displayName').then(recipient => {
                if (recipient?.lineId) {
                    this.lineNotifyService.notifyOwnerNewChatMessage(recipient.lineId, {
                        senderName,
                        itemTitle,
                        messagePreview: preview,
                        bookingId: payload.bookingId,
                    }).catch(() => { /* ignore */ });
                }
            }).catch(() => { /* ignore */ });

        } catch (err) {
            client.emit('message_error', { error: (err as Error).message });
        }
    }

    /** Client tells server they've read all messages in a booking */
    @SubscribeMessage('messages_read')
    async handleMessagesRead(
        @MessageBody() bookingId: string,
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data?.userId;
        if (!userId) return;
        try {
            const count = await this.messagesService.markAsRead(bookingId, userId);
            if (count > 0) {
                // Notify the room so sender sees read receipts update
                this.server.to(`booking:${bookingId}`).emit('messages_read_ack', {
                    bookingId,
                    readBy: userId,
                });
            }
        } catch { /* ignore */ }
    }

    broadcastToBooking(bookingId: string, event: string, payload: any) {
        this.server.to(`booking:${bookingId}`).emit(event, payload);
    }
}
