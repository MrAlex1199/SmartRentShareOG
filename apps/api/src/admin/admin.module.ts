import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Payment.name, schema: PaymentSchema },
            { name: Booking.name, schema: BookingSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [AdminController],
})
export class AdminModule { }
