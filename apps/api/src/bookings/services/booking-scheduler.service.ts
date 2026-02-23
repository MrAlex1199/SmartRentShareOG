import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingDocument, BookingStatus } from '../schemas/booking.schema';
import { LineNotifyService } from '../../notifications/line-notify.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class BookingSchedulerService {
    private readonly logger = new Logger(BookingSchedulerService.name);

    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        private lineNotifyService: LineNotifyService,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Run every hour: auto-reject bookings pending for more than 24 hours
     */
    @Cron(CronExpression.EVERY_HOUR)
    async autoRejectExpiredBookings() {
        this.logger.log('Running auto-rejection check...');

        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        const expiredBookings = await this.bookingModel
            .find({
                status: BookingStatus.PENDING,
                createdAt: { $lt: cutoffTime },
            })
            .populate('item', 'title')
            .populate('renter', 'lineId displayName')
            .populate('owner', 'lineId displayName');

        if (expiredBookings.length === 0) {
            this.logger.log('No expired bookings found.');
            return;
        }

        this.logger.log(`Found ${expiredBookings.length} expired bookings to auto-reject.`);

        for (const booking of expiredBookings) {
            try {
                // Update status to REJECTED
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

                this.logger.log(`Auto-rejected booking ${booking._id}`);

                const renter: any = booking.renter;
                const item: any = booking.item;
                const itemTitle = item?.title || 'สินค้า';
                const bookingId = (booking._id as any).toString();
                const renterId = renter?._id?.toString() || booking.renter.toString();

                // LINE notification
                if (renter?.lineId) {
                    await this.lineNotifyService.notifyRenterAutoRejected(renter.lineId, { itemTitle });
                }

                // In-app notification
                await this.notificationsService.notifyAutoRejected(renterId, { itemTitle, bookingId });

            } catch (error) {
                this.logger.error(`Failed to auto-reject booking ${booking._id}: ${error}`);
            }
        }

        this.logger.log(`Auto-rejection complete. Rejected ${expiredBookings.length} bookings.`);
    }
}
