import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AvailabilityService } from './services/availability.service';
import { BookingSchedulerService } from './services/booking-scheduler.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { ItemsModule } from '../items/items.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
        ScheduleModule.forRoot(),
        ItemsModule,
        NotificationsModule,
        PaymentsModule,
    ],
    controllers: [BookingsController],
    providers: [BookingsService, AvailabilityService, BookingSchedulerService],
    exports: [BookingsService, AvailabilityService],
})
export class BookingsModule { }
