import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DisputeDocument = Dispute & Document;

export enum DisputeStatus {
    OPEN = 'open',
    REVIEWING = 'reviewing',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
}

export enum DisputeReason {
    ITEM_DAMAGED = 'item_damaged',
    ITEM_NOT_AS_DESCRIBED = 'item_not_as_described',
    NO_SHOW = 'no_show',
    LATE_RETURN = 'late_return',
    PAYMENT_ISSUE = 'payment_issue',
    OTHER = 'other',
}

@Schema({ timestamps: true })
export class Dispute {
    @Prop({ type: Types.ObjectId, ref: 'Booking', required: true, index: true })
    booking!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    reporter!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    reportedUser!: Types.ObjectId;

    @Prop({ required: true, enum: Object.values(DisputeReason) })
    reason!: DisputeReason;

    @Prop({ required: true, maxlength: 2000 })
    description!: string;

    @Prop({ type: [String], default: [] })
    evidence!: string[]; // Cloudinary URLs

    @Prop({ default: DisputeStatus.OPEN, enum: Object.values(DisputeStatus) })
    status!: DisputeStatus;

    @Prop()
    resolution?: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    resolvedBy?: Types.ObjectId;

    @Prop()
    resolvedAt?: Date;
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);
