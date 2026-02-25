import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: Booking.name, schema: BookingSchema },
        ]),
    ],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService],
})
export class MessagesModule { }
