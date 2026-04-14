import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { Request } from 'express';

export interface AuditEvent {
    action: string;
    actor: string;               // userId หรือ 'system'
    actorRole?: 'student' | 'admin' | 'system';
    targetId?: string;
    targetType?: 'Booking' | 'User' | 'Payment' | 'Item' | 'Dispute' | 'Verification' | 'Session';
    metadata?: Record<string, any>;
    req?: Request;               // สำหรับดึง IP + User-Agent
}

export interface AuditQuery {
    actor?: string;
    action?: string;
    targetId?: string;
    targetType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    ) {}

    /**
     * บันทึก audit event — ไม่ throw ถ้า log ล้มเหลว เพื่อไม่ให้กระทบ business logic
     */
    async log(event: AuditEvent): Promise<void> {
        try {
            const ipAddress = event.req
                ? (event.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
                    || event.req.socket?.remoteAddress
                : undefined;

            const userAgent = event.req
                ? event.req.headers['user-agent']
                : undefined;

            await this.auditModel.create({
                action: event.action,
                actor: event.actor,
                actorRole: event.actorRole ?? 'system',
                targetId: event.targetId,
                targetType: event.targetType,
                metadata: event.metadata,
                ipAddress,
                userAgent,
            });
        } catch (err) {
            // Log to console เท่านั้น ไม่ throw
            this.logger.error(`Failed to write audit log [${event.action}]: ${err}`);
        }
    }

    /**
     * ดึง audit logs สำหรับ Admin (pagination)
     */
    async findAll(query: AuditQuery) {
        const {
            actor, action, targetId, targetType,
            from, to,
            page = 1, limit = 50,
        } = query;

        const filter: Record<string, any> = {};
        if (actor)      filter.actor = actor;
        if (action)     filter.action = { $regex: action, $options: 'i' };
        if (targetId)   filter.targetId = targetId;
        if (targetType) filter.targetType = targetType;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to)   filter.createdAt.$lte = new Date(to);
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            this.auditModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.auditModel.countDocuments(filter),
        ]);

        return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /**
     * สรุป event counts สำหรับ overview (7 วันล่าสุด)
     */
    async getRecentSummary() {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return this.auditModel.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
    }
}
