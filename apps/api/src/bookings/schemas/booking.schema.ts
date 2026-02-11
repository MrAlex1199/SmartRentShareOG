import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
    PENDING = 'pending',           // รอเจ้าของยืนยัน
    CONFIRMED = 'confirmed',       // เจ้าของยืนยันแล้ว รอชำระเงิน
    PAID = 'paid',                 // ชำระเงินแล้ว รอรับของ
    ACTIVE = 'active',             // กำลังเช่าอยู่
    COMPLETED = 'completed',       // คืนของเรียบร้อย
    CANCELLED = 'cancelled',       // ยกเลิกโดยผู้เช่า
    REJECTED = 'rejected',         // ปฏิเสธโดยเจ้าของ
    OVERDUE = 'overdue',          // เกินกำหนดคืน
}

export enum DeliveryMethod {
    PICKUP = 'pickup',
    DELIVERY = 'delivery',
}

export interface StatusHistoryEntry {
    status: BookingStatus;
    timestamp: Date;
    note?: string;
}

export interface ItemCondition {
    images: string[];
    notes: string;
    timestamp: Date;
}

@Schema({ timestamps: true })
export class Booking {
    @Prop({ type: Types.ObjectId, ref: 'Item', required: true })
    item!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    renter!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    owner!: Types.ObjectId;

    // Rental Period
    @Prop({ required: true })
    startDate!: Date;

    @Prop({ required: true })
    endDate!: Date;

    @Prop({ required: true })
    totalDays!: number;

    // Pricing (snapshot at booking time)
    @Prop({ required: true })
    dailyPrice!: number;

    @Prop({ required: true })
    totalPrice!: number;

    @Prop({ required: true })
    deposit!: number;

    @Prop()
    deliveryFee?: number;

    // Status Management
    @Prop({
        type: String,
        enum: Object.values(BookingStatus),
        default: BookingStatus.PENDING
    })
    status!: BookingStatus;

    @Prop({ type: Array, default: [] })
    statusHistory!: StatusHistoryEntry[];

    // Delivery & Pickup
    @Prop({
        type: String,
        enum: Object.values(DeliveryMethod),
        required: true
    })
    deliveryMethod!: DeliveryMethod;

    @Prop()
    deliveryAddress?: string;

    @Prop()
    pickupLocation?: string;

    // Documentation
    @Prop({ type: Object })
    itemConditionBefore?: ItemCondition;

    @Prop({ type: Object })
    itemConditionAfter?: ItemCondition;

    // Timestamps (automatically added by @Schema({ timestamps: true }))
    createdAt!: Date;
    updatedAt!: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Indexes for better query performance
BookingSchema.index({ item: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ renter: 1, status: 1 });
BookingSchema.index({ owner: 1, status: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });
