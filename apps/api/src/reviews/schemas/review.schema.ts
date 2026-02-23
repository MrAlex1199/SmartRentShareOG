import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
    @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
    booking!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    reviewer!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    reviewee!: Types.ObjectId;

    @Prop({ required: true, enum: ['owner', 'renter'] })
    revieweeType!: 'owner' | 'renter';

    @Prop({ required: true, min: 1, max: 5 })
    overallRating!: number;

    @Prop({ required: true, min: 1, max: 5 })
    communication!: number;

    @Prop({ required: true, min: 1, max: 5 })
    punctuality!: number;

    @Prop({ trim: true, maxlength: 500 })
    comment?: string;

    createdAt!: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Ensure one review per reviewer per booking
ReviewSchema.index({ booking: 1, reviewer: 1 }, { unique: true });
