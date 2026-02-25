import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, VerificationStatus } from './schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async findByLineId(lineId: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ lineId }).exec();
    }

    async create(createUserDto: any): Promise<UserDocument> {
        const createdUser = new this.userModel(createUserDto);
        return createdUser.save();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    // ─── Verification ───────────────────────────────────────────────

    /**
     * ผู้ใช้ส่ง request ยืนยันตัวตน — อัปโหลดรูปบัตรประชาชน / บัตรนักศึกษา
     */
    async submitVerification(
        userId: string,
        imageUrl: string,
        publicId: string,
        docType: 'national_id' | 'student_id',
    ): Promise<UserDocument> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        if (user.verification?.status === VerificationStatus.VERIFIED) {
            throw new BadRequestException('บัญชีนี้ยืนยันตัวตนสำเร็จแล้ว');
        }

        user.verification = {
            status: VerificationStatus.PENDING,
            docType,
            imageUrl,
            publicId,
            submittedAt: new Date(),
        };
        return user.save();
    }

    /**
     * Admin อนุมัติ / ปฏิเสธ การยืนยันตัวตน
     */
    async reviewVerification(
        adminId: string,
        targetUserId: string,
        action: 'approve' | 'reject',
        rejectionReason?: string,
    ): Promise<UserDocument> {
        const admin = await this.userModel.findById(adminId);
        if (!admin || admin.role !== 'admin') throw new ForbiddenException('Admin only');

        const user = await this.userModel.findById(targetUserId);
        if (!user) throw new NotFoundException('User not found');
        if (user.verification?.status !== VerificationStatus.PENDING) {
            throw new BadRequestException('ไม่มีคำขอที่รอตรวจสอบ');
        }

        user.verification = {
            ...user.verification,
            status: action === 'approve' ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED,
            reviewedAt: new Date(),
            rejectionReason: action === 'reject' ? (rejectionReason || 'เอกสารไม่ถูกต้อง') : undefined,
        };

        if (action === 'approve') {
            user.isVerified = true;
        }

        return user.save();
    }

    /**
     * Admin เรียกดูรายการ pending verifications
     */
    async getPendingVerifications(): Promise<UserDocument[]> {
        return this.userModel.find({ 'verification.status': VerificationStatus.PENDING })
            .select('displayName pictureUrl verification createdAt')
            .sort({ 'verification.submittedAt': 1 })
            .exec();
    }
}
