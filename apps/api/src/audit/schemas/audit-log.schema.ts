import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
    /** ชนิดของ action เช่น 'booking.created', 'user.banned', 'payment.released' */
    @Prop({ required: true, index: true })
    action!: string;

    /** ID ของผู้กระทำ (userId หรือ 'system' สำหรับ cron job) */
    @Prop({ required: true, index: true })
    actor!: string;

    /** Role ของผู้กระทำ ณ เวลานั้น */
    @Prop({ enum: ['student', 'admin', 'system'], default: 'system' })
    actorRole!: string;

    /** ID ของ object ที่ถูกกระทำ (bookingId, userId, paymentId, itemId) */
    @Prop({ index: true })
    targetId?: string;

    /** ชนิดของ target */
    @Prop({ enum: ['Booking', 'User', 'Payment', 'Item', 'Dispute', 'Verification', 'Session'] })
    targetType?: string;

    /** ข้อมูลสำคัญเพิ่มเติม (amount, reason, oldStatus, newStatus ฯลฯ) */
    @Prop({ type: Object })
    metadata?: Record<string, any>;

    /** IP address ของ request (สำหรับ login/logout) */
    @Prop()
    ipAddress?: string;

    /** User-Agent string */
    @Prop()
    userAgent?: string;

    // createdAt, updatedAt — auto by @Schema timestamps
    createdAt!: Date;
    updatedAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// TTL index: เก็บ log นาน 2 ปี ตาม PDPA (63,072,000 วินาที)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63_072_000 });

// Compound indexes สำหรับ query ที่ใช้บ่อย
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ targetId: 1, targetType: 1 });
