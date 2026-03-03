import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    /** Get (or create) payment for a booking */
    @Get('booking/:bookingId')
    async getPayment(@Param('bookingId') bookingId: string, @Request() req: any) {
        return this.paymentsService.getOrCreateForBooking(bookingId, req.user.userId);
    }

    /** Renter submits payment slip */
    @Post('booking/:bookingId/slip')
    async submitSlip(
        @Param('bookingId') bookingId: string,
        @Body() body: { slipImageUrl: string; slipPublicId: string },
        @Request() req: any,
    ) {
        return this.paymentsService.submitSlip(
            bookingId,
            body.slipImageUrl,
            body.slipPublicId,
            req.user.userId,
        );
    }

    /** Owner verifies payment */
    @Patch('booking/:bookingId/verify')
    async verifyPayment(@Param('bookingId') bookingId: string, @Request() req: any) {
        return this.paymentsService.verifyPayment(bookingId, 'verify', req.user.userId);
    }

    /** Owner rejects payment */
    @Patch('booking/:bookingId/reject')
    async rejectPayment(
        @Param('bookingId') bookingId: string,
        @Body() body: { reason?: string },
        @Request() req: any,
    ) {
        return this.paymentsService.verifyPayment(
            bookingId,
            'reject',
            req.user.userId,
            body.reason,
        );
    }

    /** GET /payments/my-payouts — รายการโอนเงินของเจ้าของ */
    @Get('my-payouts')
    async getMyPayouts(@Request() req: any) {
        return this.paymentsService.getOwnerPayouts(req.user.userId);
    }
}
