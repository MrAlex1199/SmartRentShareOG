import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, VerificationStatus, UserStatus } from './schemas/user.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private auditService: AuditService,
    ) { }

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

        const saved = await user.save();

        // Audit log
        await this.auditService.log({
            action: action === 'approve' ? 'verification.approved' : 'verification.rejected',
            actor: adminId,
            actorRole: 'admin',
            targetId: targetUserId,
            targetType: 'Verification',
            metadata: { docType: user.verification?.docType, reason: rejectionReason },
        });

        return saved;
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

    // ─── Admin: User Management ──────────────────────────────────────

    /** Admin ดึงรายชื่อผู้ใช้ทั้งหมด พร้อม search + pagination */
    async listAll(opts: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ users: UserDocument[]; total: number }> {
        const page = Math.max(1, opts.page ?? 1);
        const limit = Math.min(100, opts.limit ?? 20);
        const skip = (page - 1) * limit;

        const query: any = {};
        if (opts.search) {
            query.displayName = { $regex: opts.search, $options: 'i' };
        }

        const [users, total] = await Promise.all([
            this.userModel
                .find(query)
                .select('displayName pictureUrl lineId email role status isVerified averageRating totalReviews createdAt verification')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.userModel.countDocuments(query),
        ]);

        return { users, total };
    }

    /** Admin แบน / ปลดแบน ผู้ใช้ */
    async setStatus(
        adminId: string,
        targetUserId: string,
        status: 'active' | 'banned',
    ): Promise<UserDocument> {
        const admin = await this.userModel.findById(adminId);
        if (!admin || admin.role !== 'admin') throw new ForbiddenException('Admin only');

        const user = await this.userModel.findById(targetUserId);
        if (!user) throw new NotFoundException('User not found');
        if (user._id.toString() === adminId) throw new BadRequestException('ไม่สามารถแก้ไขสถานะตัวเองได้');

        (user as any).status = status;
        const saved = await user.save();

        // Audit log
        await this.auditService.log({
            action: status === 'banned' ? 'user.banned' : 'user.unbanned',
            actor: adminId,
            actorRole: 'admin',
            targetId: targetUserId,
            targetType: 'User',
            metadata: { displayName: user.displayName, newStatus: status },
        });

        return saved;
    }

    /** Admin เปลี่ยน Role ผู้ใช้ */
    async setRole(
        adminId: string,
        targetUserId: string,
        role: 'student' | 'admin',
    ): Promise<UserDocument> {
        const admin = await this.userModel.findById(adminId);
        if (!admin || admin.role !== 'admin') throw new ForbiddenException('Admin only');

        const user = await this.userModel.findById(targetUserId);
        if (!user) throw new NotFoundException('User not found');
        if (user._id.toString() === adminId) throw new BadRequestException('ไม่สามารถเปลี่ยน Role ตัวเองได้');

        user.role = role;
        const saved = await user.save();

        // Audit log
        await this.auditService.log({
            action: 'user.role_changed',
            actor: adminId,
            actorRole: 'admin',
            targetId: targetUserId,
            targetType: 'User',
            metadata: { displayName: user.displayName, newRole: role },
        });

        return saved;
    }

    // ─── Address Management (H3) ────────────────────────────────────

    async addSavedAddress(userId: string, label: string, address: string, isDefault: boolean): Promise<UserDocument> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const addresses = user.savedAddresses || [];

        // If new address is default, reset others
        if (isDefault) {
            addresses.forEach(a => a.isDefault = false);
        }

        addresses.push({ label, address, isDefault: isDefault || addresses.length === 0 });
        user.savedAddresses = addresses;

        return user.save();
    }

    async updateSavedAddress(userId: string, index: number, label: string, address: string, isDefault: boolean): Promise<UserDocument> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const addresses = user.savedAddresses || [];
        if (index < 0 || index >= addresses.length) throw new BadRequestException('Invalid address index');

        if (isDefault) {
            addresses.forEach((a, i) => a.isDefault = (i === index));
        } else if (addresses[index].isDefault && addresses.length > 1) {
            // Cannot unset default if it's the only one, another should be default
            // Just let it unset, UI can handle
        }

        addresses[index] = { label, address, isDefault: isDefault || addresses[index].isDefault };
        user.savedAddresses = addresses;

        return user.save();
    }

    async deleteSavedAddress(userId: string, index: number): Promise<UserDocument> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const addresses = user.savedAddresses || [];
        if (index < 0 || index >= addresses.length) throw new BadRequestException('Invalid address index');

        const removed = addresses.splice(index, 1)[0];

        // If deleted default, make first one default
        if (removed.isDefault && addresses.length > 0) {
            addresses[0].isDefault = true;
        }

        user.savedAddresses = addresses;
        return user.save();
    }
}
