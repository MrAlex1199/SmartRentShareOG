import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dispute, DisputeDocument, DisputeReason, DisputeStatus } from './schemas/dispute.schema';

@Injectable()
export class DisputesService {
    constructor(
        @InjectModel(Dispute.name) private disputeModel: Model<DisputeDocument>,
        @InjectModel('Booking') private bookingModel: Model<any>,
        @InjectModel('User') private userModel: Model<any>,
    ) { }

    /** เปิด dispute ใหม่ */
    async openDispute(
        bookingId: string,
        reporterId: string,
        reason: DisputeReason,
        description: string,
        evidence: string[] = [],
    ): Promise<DisputeDocument> {
        const booking = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('ไม่พบการจอง');

        const renterId = booking.renter.toString();
        const ownerId = booking.owner.toString();

        if (reporterId !== renterId && reporterId !== ownerId) {
            throw new ForbiddenException('คุณไม่มีสิทธิ์รายงานการจองนี้');
        }

        if (!['active', 'paid', 'completed'].includes(booking.status)) {
            throw new BadRequestException('สามารถรายงานได้เฉพาะการจองที่กำลังดำเนินอยู่');
        }

        // Check no existing open dispute for this booking from same reporter
        const existing = await this.disputeModel.findOne({
            booking: new Types.ObjectId(bookingId),
            reporter: new Types.ObjectId(reporterId),
            status: { $in: [DisputeStatus.OPEN, DisputeStatus.REVIEWING] },
        });
        if (existing) throw new BadRequestException('มีรายงานที่รอดำเนินการอยู่แล้ว');

        const reportedUserId = reporterId === renterId ? ownerId : renterId;

        const dispute = new this.disputeModel({
            booking: new Types.ObjectId(bookingId),
            reporter: new Types.ObjectId(reporterId),
            reportedUser: new Types.ObjectId(reportedUserId),
            reason,
            description,
            evidence,
            status: DisputeStatus.OPEN,
        });

        return dispute.save();
    }

    /** ดู disputes ของตัวเอง */
    async getMyDisputes(userId: string): Promise<DisputeDocument[]> {
        return this.disputeModel
            .find({ $or: [{ reporter: new Types.ObjectId(userId) }, { reportedUser: new Types.ObjectId(userId) }] })
            .populate('booking', 'status')
            .populate('reporter', 'displayName pictureUrl')
            .populate('reportedUser', 'displayName pictureUrl')
            .sort({ createdAt: -1 })
            .exec();
    }

    /** Admin: ดู disputes ทั้งหมด */
    async getAllDisputes(status?: DisputeStatus): Promise<DisputeDocument[]> {
        const filter = status ? { status } : {};
        return this.disputeModel
            .find(filter)
            .populate('booking', 'status')
            .populate('reporter', 'displayName pictureUrl')
            .populate('reportedUser', 'displayName pictureUrl')
            .sort({ createdAt: -1 })
            .exec();
    }

    /** Admin: แก้ไข dispute */
    async resolveDispute(
        disputeId: string,
        adminId: string,
        action: 'resolve' | 'dismiss',
        resolution: string,
    ): Promise<DisputeDocument> {
        const admin = await this.userModel.findById(adminId);
        if (!admin || admin.role !== 'admin') throw new ForbiddenException('Admin only');

        const dispute = await this.disputeModel.findById(disputeId);
        if (!dispute) throw new NotFoundException('ไม่พบรายงาน');

        dispute.status = action === 'resolve' ? DisputeStatus.RESOLVED : DisputeStatus.DISMISSED;
        dispute.resolution = resolution;
        dispute.resolvedBy = new Types.ObjectId(adminId);
        dispute.resolvedAt = new Date();
        return dispute.save();
    }
}
