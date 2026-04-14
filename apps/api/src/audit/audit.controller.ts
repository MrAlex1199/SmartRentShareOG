import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditService, AuditQuery } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    /**
     * GET /audit-logs — Admin only
     * Query: ?actor=&action=&targetId=&targetType=&from=&to=&page=&limit=
     */
    @Get()
    async findAll(@Request() req: any, @Query() query: AuditQuery) {
        if (req.user?.role !== 'admin') {
            return { logs: [], total: 0, page: 1, limit: 50, totalPages: 0 };
        }
        return this.auditService.findAll(query);
    }

    /**
     * GET /audit-logs/summary — สรุป 7 วันล่าสุด
     */
    @Get('summary')
    async getSummary(@Request() req: any) {
        if (req.user?.role !== 'admin') return [];
        return this.auditService.getRecentSummary();
    }
}
