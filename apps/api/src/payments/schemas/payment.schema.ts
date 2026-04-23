import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
    PENDING = 'pending',       // รอผู้เช่าอัปโหลดสลิป
    SUBMITTED = 'submitted',   // ผู้เช่าส่งสลิปแล้ว รอเจ้าของตรวจ
    VERIFIED = 'verified',     // เจ้าของยืนยัน เงิน hold ใน escrow
    REJECTED = 'rejected',     // เจ้าของปฏิเสธ ให้ส่งสลิปใหม่
    RELEASED = 'released',     // เงิน release ให้เจ้าของแล้ว (หลัง completed)
}

@Schema({ timestamps: true })
export class Payment {
    @Prop({ type: Types.ObjectId, ref: 'Booking', required: true, unique: true })
    booking!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    payer!: Types.ObjectId;

    /** Total amount paid by renter (rent + deposit + delivery) */
    @Prop({ required: true })
    amount!: number;

    @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
    status!: PaymentStatus;

    /** Cloudinary URL of the uploaded slip image */
    @Prop()
    slipImageUrl?: string;

    /** Cloudinary public_id for potential deletion */
    @Prop()
    slipPublicId?: string;

    /** Date/time slip was submitted */
    @Prop()
    submittedAt?: Date;

    /** PromptPay account info */
    @Prop()
    promptpayAccount?: string;

    /** Owner's rejection reason */
    @Prop()
    rejectionReason?: string;

    /** Date/time payment was verified or rejected */
    @Prop()
    resolvedAt?: Date;

    // ─── Platform GP (20%) ───────────────────────────────────────
    /** GP percentage charged by platform (default: 20) */
    @Prop({ default: 20 })
    platformFeePercent!: number;

    /** Platform fee amount = rentalPrice × 20% (deposit excluded) */
    @Prop({ default: 0 })
    platformFeeAmount!: number;

    /** Amount owner actually receives = rentalPrice - platformFeeAmount (deposit not included) */
    @Prop({ default: 0 })
    ownerReceivesAmount!: number;

    /** Deposit amount held separately — returned in full to renter after completion */
    @Prop({ default: 0 })
    depositAmount!: number;

    /** Timestamp when escrow was released to owner */
    @Prop()
    escrowReleasedAt?: Date;

    createdAt!: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
