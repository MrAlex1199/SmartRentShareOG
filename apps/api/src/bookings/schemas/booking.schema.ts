import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
    PENDING = 'pending',           // รอเจ้าของยืนยัน
    CONFIRMED = 'confirmed',       // เจ้าของยืนยันแล้ว รอผู้เช่าชำระเงิน
    PAID = 'paid',                 // ชำระเงินแล้ว เงิน hold ใน escrow รอนัดรับของ
    ACTIVE = 'active',             // รับของสำเร็จทั้งคู่ยืนยัน กำลังเช่าอยู่
    COMPLETED = 'completed',       // คืนของสำเร็จ เงิน release ให้เจ้าของ
    CANCELLED = 'cancelled',       // ยกเลิกโดยผู้เช่า (ก่อน PAID)
    REJECTED = 'rejected',         // ปฏิเสธโดยเจ้าของ
    OVERDUE = 'overdue',           // เกินกำหนดคืน
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

    // ─── Rental Period ───────────────────────────────────────────
    @Prop({ required: true })
    startDate!: Date;

    @Prop({ required: true })
    endDate!: Date;

    @Prop({ required: true })
    totalDays!: number;

    // ─── Pricing (snapshot at booking time) ─────────────────────
    @Prop({ required: true })
    dailyPrice!: number;

    @Prop({ required: true })
    totalPrice!: number;

    @Prop({ required: true })
    deposit!: number;

    @Prop()
    deliveryFee?: number;

    // ─── Status ─────────────────────────────────────────────────
    @Prop({
        type: String,
        enum: Object.values(BookingStatus),
        default: BookingStatus.PENDING
    })
    status!: BookingStatus;

    @Prop({ type: Array, default: [] })
    statusHistory!: StatusHistoryEntry[];

    // ─── Delivery & Pickup ──────────────────────────────────────
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

    // ─── Appointment (นัดรับ/ส่งของ) ────────────────────────────
    /** วันเวลาที่นัดรับของ (ตั้งหลัง PAID) */
    @Prop()
    appointmentDate?: Date;

    // ─── Digital Agreement (ยอมรับเงื่อนไข) ─────────────────────
    /** ผู้เช่ากด "ยอมรับเงื่อนไข" ก่อนรับของ */
    @Prop({ default: false })
    contractAgreedByRenter!: boolean;

    /** เจ้าของกด "ยอมรับเงื่อนไข" ก่อนส่งของ */
    @Prop({ default: false })
    contractAgreedByOwner!: boolean;

    // ─── Handover Confirmation (รับของ) ─────────────────────────
    /** ผู้เช่าอัปโหลดรูปสินค้า + กด "ยืนยันรับของ" */
    @Prop({ default: false })
    renterConfirmedHandover!: boolean;

    /** เจ้าของกด "ยืนยันส่งของ" → trigger ACTIVE */
    @Prop({ default: false })
    ownerConfirmedHandover!: boolean;

    // ─── Return Confirmation (คืนของ) ───────────────────────────
    /** เจ้าของอัปโหลดรูปสภาพหลังคืน + กด "ยืนยันรับคืน" */
    @Prop({ default: false })
    ownerConfirmedReturn!: boolean;

    /** ผู้เช่ากด "ยืนยันคืนของ" → trigger COMPLETED + release escrow */
    @Prop({ default: false })
    renterConfirmedReturn!: boolean;

    // ─── Item Condition Documentation ───────────────────────────
    /** รูปสภาพสินค้าก่อนให้เช่า (ณ จุดส่งมอบ) */
    @Prop({ type: Object })
    itemConditionBefore?: ItemCondition;

    /** รูปสภาพสินค้าหลังคืน */
    @Prop({ type: Object })
    itemConditionAfter?: ItemCondition;

    // Timestamps (auto by @Schema timestamps)
    createdAt!: Date;
    updatedAt!: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ item: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ renter: 1, status: 1 });
BookingSchema.index({ owner: 1, status: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });
