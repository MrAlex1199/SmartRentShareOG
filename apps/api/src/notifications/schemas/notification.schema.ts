import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
    BOOKING_NEW = 'booking_new',
    BOOKING_CONFIRMED = 'booking_confirmed',
    BOOKING_REJECTED = 'booking_rejected',
    BOOKING_CANCELLED = 'booking_cancelled',
    BOOKING_AUTO_REJECTED = 'booking_auto_rejected',
    PAYMENT_SUBMITTED = 'payment_submitted',
    PAYMENT_VERIFIED = 'payment_verified',
    REVIEW_RECEIVED = 'review_received',
}

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user!: Types.ObjectId;

    @Prop({ required: true, enum: NotificationType })
    type!: NotificationType;

    @Prop({ required: true })
    title!: string;

    @Prop({ required: true })
    message!: string;

    @Prop({ type: Types.ObjectId, ref: 'Booking' })
    booking?: Types.ObjectId;

    @Prop({ default: false })
    isRead!: boolean;

    // timestamps adds createdAt/updatedAt
    createdAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
