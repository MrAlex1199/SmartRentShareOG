import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
    @Prop({ type: Types.ObjectId, ref: 'Booking', required: true, index: true })
    booking!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    sender!: Types.ObjectId;

    @Prop({ required: true, maxlength: 1000 })
    content!: string;

    @Prop({ default: 'text', enum: ['text', 'image', 'system'] })
    messageType!: 'text' | 'image' | 'system';

    @Prop({ default: false })
    isRead!: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
// Index for fast booking message queries (newest first)
MessageSchema.index({ booking: 1, createdAt: -1 });
