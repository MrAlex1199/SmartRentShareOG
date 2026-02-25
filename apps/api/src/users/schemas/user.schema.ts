import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User as UserInterface } from '@repo/shared';

export type UserDocument = User & Document;

/** สถานะการ verify เอกสาร */
export enum VerificationStatus {
    NONE = 'none',         // ยังไม่เคยส่ง
    PENDING = 'pending',   // รออนุมัติ
    VERIFIED = 'verified', // อนุมัติแล้ว
    REJECTED = 'rejected', // ถูกปฏิเสธ
}

@Schema({ timestamps: true })
export class User implements Omit<UserInterface, '_id' | 'createdAt' | 'updatedAt'> {
    @Prop({ required: true, unique: true })
    lineId!: string;

    @Prop({ required: true })
    displayName!: string;

    @Prop()
    pictureUrl!: string;

    @Prop()
    email!: string;

    @Prop({ default: 'student', enum: ['student', 'admin'] })
    role!: 'student' | 'admin';

    @Prop({ default: false })
    isVerified!: boolean;

    @Prop({ default: 0, min: 0, max: 5 })
    averageRating!: number;

    @Prop({ default: 0 })
    totalReviews!: number;

    // ─── ID Verification ───────────────────────────────────────────
    @Prop({
        type: {
            status: { type: String, enum: Object.values(VerificationStatus), default: VerificationStatus.NONE },
            docType: { type: String, enum: ['national_id', 'student_id'] },
            imageUrl: { type: String },
            publicId: { type: String },
            submittedAt: { type: Date },
            reviewedAt: { type: Date },
            rejectionReason: { type: String },
        },
        default: { status: VerificationStatus.NONE },
    })
    verification!: {
        status: VerificationStatus;
        docType?: 'national_id' | 'student_id';
        imageUrl?: string;
        publicId?: string;
        submittedAt?: Date;
        reviewedAt?: Date;
        rejectionReason?: string;
    };
}

export const UserSchema = SchemaFactory.createForClass(User);
