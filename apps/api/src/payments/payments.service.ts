import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

const PLATFORM_FEE_PERCENT = 10;

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
        @InjectModel('Booking') private bookingModel: Model<any>,
        @InjectModel('Item') private itemModel: Model<any>,
        private notificationsService: NotificationsService,
    ) { }

    // ─────────────────────────────────── Get / Create ────────────────────────────────────
    async getOrCreateForBooking(bookingId: string, userId: string): Promise<PaymentDocument> {
        const booking: any = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');

        const renterId = booking.renter.toString();
        const ownerId = booking.owner.toString();
        if (userId !== renterId && userId !== ownerId) throw new ForbiddenException('Access denied');

        if (booking.status !== 'confirmed') {
            throw new BadRequestException('Payment only available for confirmed bookings');
        }

        let payment = await this.paymentModel.findOne({ booking: new Types.ObjectId(bookingId) });
        if (!payment) {
            const totalAmount = booking.totalPrice + (booking.deliveryFee || 0) + (booking.deposit || 0);
            const platformFeeAmount = Math.round(booking.totalPrice * PLATFORM_FEE_PERCENT / 100);
            const ownerReceivesAmount = totalAmount - platformFeeAmount;

            payment = new this.paymentModel({
                booking: new Types.ObjectId(bookingId),
                payer: new Types.ObjectId(renterId),
                amount: totalAmount,
                status: PaymentStatus.PENDING,
                platformFeePercent: PLATFORM_FEE_PERCENT,
                platformFeeAmount,
                ownerReceivesAmount,
            });
            await payment.save();
        }

        return payment;
    }

    // ─────────────────────────────────── Submit Slip ─────────────────────────────────────
    async submitSlip(
        bookingId: string,
        slipImageUrl: string,
        slipPublicId: string,
        userId: string,
    ): Promise<PaymentDocument> {
        const booking: any = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.renter.toString() !== userId) throw new ForbiddenException('Only renter can submit payment');
        if (booking.status !== 'confirmed') throw new BadRequestException('Booking must be confirmed before payment');

        let payment = await this.paymentModel.findOne({ booking: new Types.ObjectId(bookingId) });
        if (!payment) {
            const totalAmount = booking.totalPrice + (booking.deliveryFee || 0) + (booking.deposit || 0);
            const platformFeeAmount = Math.round(booking.totalPrice * PLATFORM_FEE_PERCENT / 100);
            payment = new this.paymentModel({
                booking: new Types.ObjectId(bookingId),
                payer: new Types.ObjectId(userId),
                amount: totalAmount,
                status: PaymentStatus.PENDING,
                platformFeePercent: PLATFORM_FEE_PERCENT,
                platformFeeAmount,
                ownerReceivesAmount: totalAmount - platformFeeAmount,
            });
        }

        if (payment.status === PaymentStatus.VERIFIED) throw new BadRequestException('Payment already verified');

        payment.slipImageUrl = slipImageUrl;
        payment.slipPublicId = slipPublicId;
        payment.status = PaymentStatus.SUBMITTED;
        payment.submittedAt = new Date();
        const saved = await payment.save();

        // Notify owner
        await this.notificationsService.create({
            userId: booking.owner.toString(),
            type: NotificationType.PAYMENT_SUBMITTED,
            title: '💳 ผู้เช่าส่งหลักฐานโอนเงินแล้ว',
            message: 'กรุณาตรวจสอบและยืนยันการชำระเงิน',
            bookingId,
        });

        return saved;
    }

    // ─────────────────────────────────── Verify / Reject Slip ────────────────────────────
    async verifyPayment(
        bookingId: string,
        action: 'verify' | 'reject',
        userId: string,
        rejectionReason?: string,
    ): Promise<PaymentDocument> {
        const booking: any = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.owner.toString() !== userId) throw new ForbiddenException('Only owner can verify payment');

        const payment = await this.paymentModel.findOne({ booking: new Types.ObjectId(bookingId) });
        if (!payment) throw new NotFoundException('Payment not found');
        if (payment.status !== PaymentStatus.SUBMITTED) throw new BadRequestException('No pending payment to verify');

        const renterId = booking.renter.toString();

        if (action === 'verify') {
            payment.status = PaymentStatus.VERIFIED;
            payment.resolvedAt = new Date();

            // ✅ NEW: PAID (escrow held), NOT completed — renter must pick up first
            await this.bookingModel.findByIdAndUpdate(bookingId, {
                status: 'paid',
                $push: {
                    statusHistory: {
                        status: 'paid',
                        timestamp: new Date(),
                        note: 'Payment verified — funds held in escrow',
                    },
                },
            });

            await this.notificationsService.create({
                userId: renterId,
                type: NotificationType.PAYMENT_VERIFIED,
                title: '✅ ยืนยันการชำระเงินสำเร็จ',
                message: 'เงินถูก hold ในระบบแล้ว กรุณานัดรับของกับเจ้าของสินค้า',
                bookingId,
            });
            await this.notificationsService.create({
                userId,
                type: NotificationType.PAYMENT_VERIFIED,
                title: '💰 รับการชำระเงินสำเร็จ',
                message: 'เงินถูก hold ไว้รอการส่งมอบสินค้า นัดรับของกับผู้เช่าได้เลย',
                bookingId,
            });
        } else {
            payment.status = PaymentStatus.REJECTED;
            payment.rejectionReason = rejectionReason;
            payment.resolvedAt = new Date();

            await this.notificationsService.create({
                userId: renterId,
                type: NotificationType.PAYMENT_SUBMITTED,
                title: '❌ หลักฐานชำระเงินถูกปฏิเสธ',
                message: rejectionReason ? `เหตุผล: ${rejectionReason}` : 'กรุณาส่งหลักฐานใหม่อีกครั้ง',
                bookingId,
            });
        }

        return payment.save();
    }

    // ─────────────────────────────────── Confirm Handover (รับของ) ───────────────────────
    /**
     * Both renter AND owner must call this.
     * When both confirmed → booking status = 'active'
     */
    async confirmHandover(bookingId: string, userId: string): Promise<any> {
        const booking: any = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== 'paid') throw new BadRequestException('Booking must be in PAID status');

        const renterId = booking.renter.toString();
        const ownerId = booking.owner.toString();
        const isRenter = userId === renterId;
        const isOwner = userId === ownerId;
        if (!isRenter && !isOwner) throw new ForbiddenException('Access denied');

        if (isRenter && !booking.itemConditionBefore?.images?.length) {
            throw new BadRequestException('กรุณาอัปโหลดรูปสินค้าก่อนยืนยันรับของ');
        }
        if (isRenter && !booking.contractAgreedByRenter) {
            throw new BadRequestException('กรุณายอมรับเงื่อนไขก่อนยืนยันรับของ');
        }
        if (isOwner && !booking.contractAgreedByOwner) {
            throw new BadRequestException('กรุณายอมรับเงื่อนไขก่อนยืนยันส่งของ');
        }

        const updateField = isRenter ? 'renterConfirmedHandover' : 'ownerConfirmedHandover';
        const updated: any = await this.bookingModel.findByIdAndUpdate(
            bookingId,
            { [updateField]: true },
            { new: true },
        );

        // Both must confirm to go ACTIVE
        const bothConfirmed = updated.renterConfirmedHandover && updated.ownerConfirmedHandover;
        if (bothConfirmed) {
            await this.bookingModel.findByIdAndUpdate(bookingId, {
                status: 'active',
                $push: {
                    statusHistory: {
                        status: 'active',
                        timestamp: new Date(),
                        note: 'Both parties confirmed handover',
                    },
                },
            });
            // Notify both
            await this.notificationsService.create({
                userId: renterId,
                type: NotificationType.BOOKING_CONFIRMED,
                title: '🎉 รับของสำเร็จ! เริ่มเช่าได้เลย',
                message: 'การส่งมอบสินค้าเสร็จสมบูรณ์ เพลิดเพลินกับการใช้งาน',
                bookingId,
            });
            await this.notificationsService.create({
                userId: ownerId,
                type: NotificationType.BOOKING_CONFIRMED,
                title: '📦 ส่งมอบสินค้าสำเร็จ',
                message: 'ผู้เช่าได้รับสินค้าแล้ว สัญญาเช่าเริ่มต้นแล้ว',
                bookingId,
            });
        } else {
            // Notify the other party
            const otherUserId = isRenter ? ownerId : renterId;
            const otherRole = isRenter ? 'เจ้าของ' : 'ผู้เช่า';
            await this.notificationsService.create({
                userId: otherUserId,
                type: NotificationType.BOOKING_CONFIRMED,
                title: '⏳ รอการยืนยันรับของจากคุณ',
                message: `${isRenter ? 'ผู้เช่า' : otherRole}ยืนยันแล้ว รอ${otherRole}ยืนยันอีกฝ่าย`,
                bookingId,
            });
        }

        return this.bookingModel.findById(bookingId);
    }

    // ─────────────────────────────────── Confirm Return (คืนของ) ─────────────────────────
    /**
     * Both parties confirm return.
     * When both confirmed → COMPLETED + release escrow (calculate GP).
     */
    async confirmReturn(bookingId: string, userId: string): Promise<any> {
        const booking: any = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== 'active') throw new BadRequestException('Booking must be ACTIVE to confirm return');

        const renterId = booking.renter.toString();
        const ownerId = booking.owner.toString();
        const isRenter = userId === renterId;
        const isOwner = userId === ownerId;
        if (!isRenter && !isOwner) throw new ForbiddenException('Access denied');

        if (isOwner && !booking.itemConditionAfter?.images?.length) {
            throw new BadRequestException('กรุณาอัปโหลดรูปสภาพสินค้าหลังรับคืนก่อน');
        }

        const updateField = isRenter ? 'renterConfirmedReturn' : 'ownerConfirmedReturn';
        const updated: any = await this.bookingModel.findByIdAndUpdate(
            bookingId,
            { [updateField]: true },
            { new: true },
        );

        const bothConfirmed = updated.renterConfirmedReturn && updated.ownerConfirmedReturn;
        if (bothConfirmed) {
            // Mark booking COMPLETED
            await this.bookingModel.findByIdAndUpdate(bookingId, {
                status: 'completed',
                $push: {
                    statusHistory: {
                        status: 'completed',
                        timestamp: new Date(),
                        note: 'Both parties confirmed return — escrow released',
                    },
                },
            });

            // Release escrow — update payment record
            const payment = await this.paymentModel.findOne({ booking: new Types.ObjectId(bookingId) });
            if (payment) {
                payment.status = PaymentStatus.RELEASED;
                payment.escrowReleasedAt = new Date();
                await payment.save();
            }

            // ✅ Restore item availability so it can be rented again
            if (booking.item) {
                await this.itemModel.findByIdAndUpdate(booking.item, { isAvailable: true });
                this.logger.log(`Item ${booking.item} availability restored after return (booking ${bookingId})`);
            }

            // Notify both
            await this.notificationsService.create({
                userId: renterId,
                type: NotificationType.BOOKING_CONFIRMED,
                title: '✅ คืนของสำเร็จ! ขอบคุณที่ใช้บริการ',
                message: 'การเช่าเสร็จสมบูรณ์ อย่าลืมให้คะแนนเจ้าของด้วยนะ',
                bookingId,
            });
            await this.notificationsService.create({
                userId: ownerId,
                type: NotificationType.PAYMENT_VERIFIED,
                title: `💰 รับเงินสำเร็จ ฿${payment?.ownerReceivesAmount?.toLocaleString() || ''}`,
                message: `หักค่าบริการแพลตฟอร์ม ${PLATFORM_FEE_PERCENT}% แล้ว อย่าลืมให้คะแนนผู้เช่าด้วย`,
                bookingId,
            });
        } else {
            const otherUserId = isRenter ? ownerId : renterId;
            await this.notificationsService.create({
                userId: otherUserId,
                type: NotificationType.BOOKING_CONFIRMED,
                title: '⏳ รอการยืนยันคืนของจากคุณ',
                message: `${isRenter ? 'ผู้เช่า' : 'เจ้าของ'}ยืนยันคืนของแล้ว รออีกฝ่ายยืนยัน`,
                bookingId,
            });
        }

        return this.bookingModel.findById(bookingId);
    }

    // ─────────────────────────────────── Agree Contract ──────────────────────────────────
    async agreeContract(bookingId: string, userId: string): Promise<any> {
        const booking: any = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== 'paid') throw new BadRequestException('Contract agreement only for PAID bookings');

        const isRenter = booking.renter.toString() === userId;
        const isOwner = booking.owner.toString() === userId;
        if (!isRenter && !isOwner) throw new ForbiddenException('Access denied');

        const field = isRenter ? 'contractAgreedByRenter' : 'contractAgreedByOwner';
        return this.bookingModel.findByIdAndUpdate(bookingId, { [field]: true }, { new: true });
    }

    // ─────────────────────────────────── Upload Condition Photos ─────────────────────────
    async uploadConditionPhotos(
        bookingId: string,
        userId: string,
        phase: 'before' | 'after',
        imageUrls: string[],
        notes: string,
    ): Promise<any> {
        const booking: any = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');

        const renterId = booking.renter.toString();
        const ownerId = booking.owner.toString();
        if (userId !== renterId && userId !== ownerId) throw new ForbiddenException('Access denied');

        if (phase === 'before' && booking.status !== 'paid') {
            throw new BadRequestException('Before photos only for PAID bookings');
        }
        if (phase === 'after' && booking.status !== 'active') {
            throw new BadRequestException('After photos only for ACTIVE bookings');
        }

        const field = phase === 'before' ? 'itemConditionBefore' : 'itemConditionAfter';
        const conditionData = { images: imageUrls, notes, timestamp: new Date() };

        return this.bookingModel.findByIdAndUpdate(
            bookingId,
            { [field]: conditionData },
            { new: true },
        );
    }

    // ─────────────────────────────────── Set Appointment ─────────────────────────────────
    async setAppointment(bookingId: string, userId: string, appointmentDate: string): Promise<any> {
        const booking: any = await this.bookingModel.findById(bookingId);
        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.status !== 'paid') throw new BadRequestException('Appointment only for PAID bookings');

        const isRenter = booking.renter.toString() === userId;
        const isOwner = booking.owner.toString() === userId;
        if (!isRenter && !isOwner) throw new ForbiddenException('Access denied');

        const updated = await this.bookingModel.findByIdAndUpdate(
            bookingId,
            { appointmentDate: new Date(appointmentDate) },
            { new: true },
        );

        // Notify the other party
        const otherUserId = isRenter ? booking.owner.toString() : booking.renter.toString();
        await this.notificationsService.create({
            userId: otherUserId,
            type: NotificationType.BOOKING_CONFIRMED,
            title: '📅 มีการนัดรับของแล้ว',
            message: `นัดหมาย: ${new Date(appointmentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            bookingId,
        });

        return updated;
    }

    // ─────────────────────────────────── Owner Payouts ───────────────────────────────────
    async getOwnerPayouts(userId: string): Promise<any[]> {
        // Find all bookings owned by the user that have payments
        const bookings = await this.bookingModel
            .find({ owner: new Types.ObjectId(userId) })
            .select('_id')
            .lean();

        const bookingIds = bookings.map((b: any) => b._id);
        if (!bookingIds.length) return [];

        return this.paymentModel
            .find({ booking: { $in: bookingIds } })
            .populate({
                path: 'booking',
                populate: [
                    { path: 'item', select: 'title images' },
                    { path: 'renter', select: 'displayName pictureUrl' },
                ],
            })
            .sort({ createdAt: -1 })
            .lean();
    }
}
