import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        private gateway: NotificationsGateway,
    ) { }

    /**
     * Create a notification and emit it via Socket.io
     */
    async create(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        bookingId?: string;
    }): Promise<NotificationDocument> {
        const notification = new this.notificationModel({
            user: new Types.ObjectId(data.userId),
            type: data.type,
            title: data.title,
            message: data.message,
            booking: data.bookingId ? new Types.ObjectId(data.bookingId) : undefined,
            isRead: false,
        });

        const saved = await notification.save();

        // Emit real-time event to the specific user
        this.gateway.sendNotificationToUser(data.userId, {
            _id: saved._id,
            type: saved.type,
            title: saved.title,
            message: saved.message,
            bookingId: data.bookingId,
            isRead: false,
            createdAt: saved.createdAt,
        });

        return saved;
    }

    /**
     * Get all notifications for a user (latest first)
     */
    async findByUser(userId: string): Promise<NotificationDocument[]> {
        return this.notificationModel
            .find({ user: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(50)
            .exec();
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationModel.countDocuments({
            user: new Types.ObjectId(userId),
            isRead: false,
        });
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        await this.notificationModel.findOneAndUpdate(
            { _id: notificationId, user: new Types.ObjectId(userId) },
            { isRead: true },
        );
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationModel.updateMany(
            { user: new Types.ObjectId(userId), isRead: false },
            { isRead: true },
        );
    }

    // ─── Notification Helpers ─────────────────────────────────────────────────

    async notifyNewBooking(ownerId: string, data: { itemTitle: string; renterName: string; bookingId: string }) {
        return this.create({
            userId: ownerId,
            type: NotificationType.BOOKING_NEW,
            title: '📦 มีคำขอจองใหม่',
            message: `${data.renterName} ขอจอง "${data.itemTitle}"`,
            bookingId: data.bookingId,
        });
    }

    async notifyBookingConfirmed(renterId: string, data: { itemTitle: string; ownerName: string; bookingId: string }) {
        return this.create({
            userId: renterId,
            type: NotificationType.BOOKING_CONFIRMED,
            title: '✅ การจองได้รับการยืนยัน',
            message: `${data.ownerName} ยืนยันการจอง "${data.itemTitle}" แล้ว`,
            bookingId: data.bookingId,
        });
    }

    async notifyBookingRejected(renterId: string, data: { itemTitle: string; reason?: string; bookingId: string }) {
        return this.create({
            userId: renterId,
            type: NotificationType.BOOKING_REJECTED,
            title: '❌ การจองถูกปฏิเสธ',
            message: `การจอง "${data.itemTitle}" ถูกปฏิเสธ${data.reason ? `: ${data.reason}` : ''}`,
            bookingId: data.bookingId,
        });
    }

    async notifyBookingCancelled(ownerId: string, data: { itemTitle: string; renterName: string; bookingId: string }) {
        return this.create({
            userId: ownerId,
            type: NotificationType.BOOKING_CANCELLED,
            title: '🚫 ผู้เช่ายกเลิกการจอง',
            message: `${data.renterName} ยกเลิกการจอง "${data.itemTitle}"`,
            bookingId: data.bookingId,
        });
    }

    async notifyAutoRejected(renterId: string, data: { itemTitle: string; bookingId: string }) {
        return this.create({
            userId: renterId,
            type: NotificationType.BOOKING_AUTO_REJECTED,
            title: '⏰ การจองหมดอายุ',
            message: `การจอง "${data.itemTitle}" หมดอายุเพราะเจ้าของไม่ตอบใน 24 ชั่วโมง`,
            bookingId: data.bookingId,
        });
    }
}
