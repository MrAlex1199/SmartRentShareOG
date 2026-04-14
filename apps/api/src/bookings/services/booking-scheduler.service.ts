import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingDocument, BookingStatus } from '../schemas/booking.schema';
import { LineNotifyService } from '../../notifications/line-notify.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/schemas/notification.schema';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class BookingSchedulerService {
    private readonly logger = new Logger(BookingSchedulerService.name);

    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        private lineNotifyService: LineNotifyService,
        private notificationsService: NotificationsService,
        private auditService: AuditService,
    ) { }

    /**
     * H1-A: ทุก 1 ชม. — auto-cancel PENDING bookings ที่เจ้าของไม่ตอบภายใน 24 ชม.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async autoRejectExpiredBookings() {
        this.logger.log('[H1-A] Running PENDING auto-rejection check...');

        const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const expiredPending = await this.bookingModel
            .find({
                status: BookingStatus.PENDING,
                createdAt: { $lt: cutoff24h },
            })
            .populate('item', 'title')
            .populate('renter', 'lineId displayName')
            .populate('owner', 'lineId displayName');

        this.logger.log(`[H1-A] Found ${expiredPending.length} PENDING bookings to auto-reject.`);

        for (const booking of expiredPending) {
            try {
                await this.bookingModel.findByIdAndUpdate(booking._id, {
                    status: BookingStatus.REJECTED,
                    $push: {
                        statusHistory: {
                            status: BookingStatus.REJECTED,
                            timestamp: new Date(),
                            note: 'Auto-rejected: owner did not respond within 24 hours',
                        },
                    },
                });

                const renter: any = booking.renter;
                const item: any = booking.item;
                const itemTitle = item?.title || 'สินค้า';
                const bookingId = (booking._id as any).toString();
                const renterId = renter?._id?.toString() || booking.renter.toString();

                if (renter?.lineId) {
                    await this.lineNotifyService.notifyRenterAutoRejected(renter.lineId, { itemTitle });
                }
                await this.notificationsService.notifyAutoRejected(renterId, { itemTitle, bookingId });

                await this.auditService.log({
                    action: 'booking.auto_cancelled',
                    actor: 'system',
                    actorRole: 'system',
                    targetId: bookingId,
                    targetType: 'Booking',
                    metadata: {
                        reason: 'owner_no_response_24h',
                        itemTitle,
                        renterId,
                    },
                });

                this.logger.log(`[H1-A] Auto-rejected booking ${bookingId}`);
            } catch (error) {
                this.logger.error(`[H1-A] Failed to auto-reject booking ${booking._id}: ${error}`);
            }
        }
    }

    /**
     * H1-B: ทุก 1 ชม. — auto-cancel CONFIRMED bookings ที่ผู้เช่าไม่ชำระภายใน 48 ชม. หลัง confirm
     */
    @Cron(CronExpression.EVERY_HOUR)
    async autoCancelUnpaidConfirmedBookings() {
        this.logger.log('[H1-B] Running CONFIRMED (unpaid) auto-cancellation check...');

        const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

        // หา bookings ที่ถูก confirm (updatedAt เก่ากว่า 48 ชม.) แต่ยังไม่มีการชำระเงิน
        const expiredConfirmed = await this.bookingModel
            .find({
                status: BookingStatus.CONFIRMED,
                updatedAt: { $lt: cutoff48h },
            })
            .populate('item', 'title isAvailable')
            .populate('renter', 'lineId displayName')
            .populate('owner', 'lineId displayName');

        this.logger.log(`[H1-B] Found ${expiredConfirmed.length} CONFIRMED bookings to auto-cancel.`);

        for (const booking of expiredConfirmed) {
            try {
                // ยกเลิก booking
                await this.bookingModel.findByIdAndUpdate(booking._id, {
                    status: BookingStatus.CANCELLED,
                    $push: {
                        statusHistory: {
                            status: BookingStatus.CANCELLED,
                            timestamp: new Date(),
                            note: 'Auto-cancelled: renter did not pay within 48 hours of confirmation',
                        },
                    },
                });

                // คืน availability ให้ item
                const item: any = booking.item;
                if (item?._id) {
                    await this.bookingModel.db.model('Item').findByIdAndUpdate(
                        item._id,
                        { isAvailable: true },
                    );
                }

                const renter: any = booking.renter;
                const owner: any = booking.owner;
                const itemTitle = item?.title || 'สินค้า';
                const bookingId = (booking._id as any).toString();
                const renterId = renter?._id?.toString() || booking.renter.toString();
                const ownerId = owner?._id?.toString() || booking.owner.toString();

                // แจ้งเตือนผู้เช่า
                if (renter?.lineId) {
                    await this.lineNotifyService.sendMessage(
                        renter.lineId,
                        `⏰ การจอง "${itemTitle}" ถูกยกเลิกอัตโนมัติ เนื่องจากไม่มีการชำระเงินภายใน 48 ชั่วโมง`,
                    ).catch(() => { });
                }

                // แจ้งเตือนเจ้าของ
                if (owner?.lineId) {
                    await this.lineNotifyService.sendMessage(
                        owner.lineId,
                        `ℹ️ การจอง "${itemTitle}" ถูกยกเลิกอัตโนมัติ (ผู้เช่าไม่ชำระภายใน 48 ชม.) สินค้าพร้อมรับจองใหม่แล้ว`,
                    ).catch(() => { });
                }

                // In-app notification ผู้เช่า
                await this.notificationsService.create({
                    userId: renterId,
                    type: NotificationType.BOOKING_CANCELLED,
                    title: 'การจองถูกยกเลิกอัตโนมัติ',
                    message: `"${itemTitle}" ถูกยกเลิกเนื่องจากไม่ชำระภายใน 48 ชม.`,
                    bookingId,
                }).catch(() => { });

                await this.auditService.log({
                    action: 'booking.auto_cancelled',
                    actor: 'system',
                    actorRole: 'system',
                    targetId: bookingId,
                    targetType: 'Booking',
                    metadata: {
                        reason: 'renter_no_payment_48h',
                        itemTitle,
                        renterId,
                        ownerId,
                    },
                });

                this.logger.log(`[H1-B] Auto-cancelled CONFIRMED booking ${bookingId}`);
            } catch (error) {
                this.logger.error(`[H1-B] Failed to auto-cancel booking ${booking._id}: ${error}`);
            }
        }
    }

    /**
     * H1-C: ทุกวันตี 1 — mark OVERDUE สำหรับ PAID bookings ที่เลย startDate+3 วันแล้วยังไม่ active
     */
    @Cron('0 1 * * *')
    async markOverdueBookings() {
        this.logger.log('[H1-C] Running OVERDUE check...');

        const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 วันที่แล้ว

        const overdueBookings = await this.bookingModel.find({
            status: BookingStatus.PAID,
            startDate: { $lt: cutoff },
        }).populate('item', 'title').populate('owner', 'displayName');

        for (const booking of overdueBookings) {
            try {
                await this.bookingModel.findByIdAndUpdate(booking._id, {
                    status: BookingStatus.OVERDUE,
                    $push: {
                        statusHistory: {
                            status: BookingStatus.OVERDUE,
                            timestamp: new Date(),
                            note: 'Auto-marked OVERDUE: paid but no handover within 3 days of startDate',
                        },
                    },
                });

                const item: any = booking.item;
                const bookingId = (booking._id as any).toString();
                await this.auditService.log({
                    action: 'booking.overdue',
                    actor: 'system',
                    actorRole: 'system',
                    targetId: bookingId,
                    targetType: 'Booking',
                    metadata: { reason: 'no_handover_3days', itemTitle: item?.title },
                });

                this.logger.log(`[H1-C] Marked OVERDUE: booking ${bookingId}`);
            } catch (error) {
                this.logger.error(`[H1-C] Failed to mark OVERDUE booking ${booking._id}: ${error}`);
            }
        }
    }
}
