import { Controller, Get, Patch, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(
        @InjectModel('Payment') private paymentModel: Model<any>,
        @InjectModel('Booking') private bookingModel: Model<any>,
        @InjectModel('User') private userModel: Model<any>,
    ) { }

    private async assertAdmin(userId: string) {
        const user = await this.userModel.findById(userId);
        if (!user || user.role !== 'admin') throw new ForbiddenException('Admin only');
    }

    /** GET /admin/stats — ภาพรวมแพลตฟอร์ม */
    @Get('stats')
    async getStats(@Request() req: any) {
        await this.assertAdmin(req.user.userId);

        const [totalPayments, pendingPayments, verifiedPayments, releasedPayments, totalBookings] =
            await Promise.all([
                this.paymentModel.countDocuments(),
                this.paymentModel.countDocuments({ status: 'pending' }),
                this.paymentModel.countDocuments({ status: 'verified' }),
                this.paymentModel.countDocuments({ status: 'released' }),
                this.bookingModel.countDocuments(),
            ]);

        // Total GP collected from released payments
        const gpResult = await this.paymentModel.aggregate([
            { $match: { status: 'released' } },
            { $group: { _id: null, totalGP: { $sum: '$platformFeeAmount' }, totalPayout: { $sum: '$ownerReceivesAmount' } } },
        ]);
        const { totalGP = 0, totalPayout = 0 } = gpResult[0] ?? {};

        // Pending payout (verified but not yet released)
        const pendingGPResult = await this.paymentModel.aggregate([
            { $match: { status: 'verified' } },
            { $group: { _id: null, pendingPayout: { $sum: '$ownerReceivesAmount' }, pendingGP: { $sum: '$platformFeeAmount' } } },
        ]);
        const { pendingPayout = 0, pendingGP = 0 } = pendingGPResult[0] ?? {};

        return {
            payments: { total: totalPayments, pending: pendingPayments, verified: verifiedPayments, released: releasedPayments },
            bookings: { total: totalBookings },
            financials: { totalGPCollected: totalGP, totalPayoutSent: totalPayout, pendingPayout, pendingGP },
        };
    }

    /** GET /admin/payments — รายการ payment ทั้งหมด */
    @Get('payments')
    async getPayments(@Request() req: any, @Query('status') status?: string) {
        await this.assertAdmin(req.user.userId);
        const filter = status ? { status } : {};
        return this.paymentModel.find(filter)
            .populate({ path: 'booking', populate: [{ path: 'renter', select: 'displayName pictureUrl' }, { path: 'owner', select: 'displayName pictureUrl' }, { path: 'item', select: 'title images' }] })
            .populate('payer', 'displayName pictureUrl')
            .sort({ createdAt: -1 })
            .limit(200)
            .exec();
    }

    /** PATCH /admin/payments/:id/release — admin mark released (โอนแล้ว) */
    @Patch('payments/:id/release')
    async releasePayment(@Param('id') paymentId: string, @Request() req: any) {
        await this.assertAdmin(req.user.userId);
        const payment = await this.paymentModel.findById(paymentId);
        if (!payment) throw new ForbiddenException('ไม่พบ payment');
        if (payment.status !== 'verified') throw new ForbiddenException('สามารถ release ได้เฉพาะ payment ที่ verified แล้ว');

        payment.status = 'released';
        payment.escrowReleasedAt = new Date();
        await payment.save();

        // Update booking to completed
        await this.bookingModel.findByIdAndUpdate(payment.booking, { status: 'completed' });

        return payment;
    }

    /** GET /admin/bookings — ดูการจองทั้งหมด */
    @Get('bookings')
    async getBookings(@Request() req: any, @Query('status') status?: string) {
        await this.assertAdmin(req.user.userId);
        const filter = status ? { status } : {};
        return this.bookingModel.find(filter)
            .populate('renter', 'displayName pictureUrl isVerified')
            .populate('owner', 'displayName pictureUrl')
            .populate('item', 'title images dailyPrice')
            .sort({ createdAt: -1 })
            .limit(200)
            .exec();
    }
}
