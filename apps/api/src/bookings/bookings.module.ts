import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AvailabilityService } from './services/availability.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { ItemsModule } from '../items/items.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
        ItemsModule, // Import to access ItemsService
    ],
    controllers: [BookingsController],
    providers: [BookingsService, AvailabilityService],
    exports: [BookingsService, AvailabilityService],
})
export class BookingsModule { }
