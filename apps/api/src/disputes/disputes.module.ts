import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dispute, DisputeSchema } from './schemas/dispute.schema';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Dispute.name, schema: DisputeSchema },
            { name: Booking.name, schema: BookingSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [DisputesController],
    providers: [DisputesService],
    exports: [DisputesService],
})
export class DisputesModule { }
