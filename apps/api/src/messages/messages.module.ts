import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { LineNotifyService } from '../notifications/line-notify.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: Booking.name, schema: BookingSchema },
            { name: Notification.name, schema: NotificationSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [MessagesController],
    providers: [MessagesService, LineNotifyService],
    exports: [MessagesService],
})
export class MessagesModule { }
