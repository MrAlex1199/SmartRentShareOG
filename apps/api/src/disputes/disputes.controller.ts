import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputeReason, DisputeStatus } from './schemas/dispute.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
    constructor(private readonly disputesService: DisputesService) { }

    /** POST /disputes — เปิด dispute ใหม่ */
    @Post()
    async openDispute(
        @Body() body: {
            bookingId: string;
            reason: DisputeReason;
            description: string;
            evidence?: string[];
        },
        @Request() req: any,
    ) {
        return this.disputesService.openDispute(
            body.bookingId,
            req.user.userId,
            body.reason,
            body.description,
            body.evidence ?? [],
        );
    }

    /** GET /disputes/mine — disputes ของตัวเอง */
    @Get('mine')
    async getMyDisputes(@Request() req: any) {
        return this.disputesService.getMyDisputes(req.user.userId);
    }

    /** GET /disputes — admin: ดูทั้งหมด */
    @Get()
    async getAllDisputes(@Query('status') status?: DisputeStatus) {
        return this.disputesService.getAllDisputes(status);
    }

    /** PATCH /disputes/:id/resolve — admin: แก้ไข */
    @Patch(':id/resolve')
    async resolveDispute(
        @Param('id') disputeId: string,
        @Body('action') action: 'resolve' | 'dismiss',
        @Body('resolution') resolution: string,
        @Request() req: any,
    ) {
        return this.disputesService.resolveDispute(disputeId, req.user.userId, action, resolution);
    }
}
