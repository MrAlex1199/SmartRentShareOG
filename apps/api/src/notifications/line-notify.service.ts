import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LineNotifyService {
    private readonly logger = new Logger(LineNotifyService.name);
    private readonly channelAccessToken: string;
    private readonly messagingApiUrl = 'https://api.line.me/v2/bot/message/push';

    constructor(private configService: ConfigService) {
        this.channelAccessToken = this.configService.get<string>('LINE_CHANNEL_ACCESS_TOKEN') || '';
        if (!this.channelAccessToken) {
            this.logger.warn('LINE_CHANNEL_ACCESS_TOKEN is not set. LINE notifications will be disabled.');
        }
    }

    /**
     * Send a push message to a LINE user
     */
    async sendMessage(lineUserId: string, message: string): Promise<boolean> {
        if (!this.channelAccessToken) {
            this.logger.warn(`LINE notification skipped (no token): ${message}`);
            return false;
        }

        try {
            const response = await fetch(this.messagingApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.channelAccessToken}`,
                },
                body: JSON.stringify({
                    to: lineUserId,
                    messages: [
                        {
                            type: 'text',
                            text: message,
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                this.logger.error(`LINE API error: ${response.status} - ${error}`);
                return false;
            }

            this.logger.log(`LINE notification sent to ${lineUserId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send LINE notification: ${error}`);
            return false;
        }
    }

    // ─── Notification Templates ───────────────────────────────────────────────

    /** แจ้งเจ้าของเมื่อมีคำขอจองใหม่ */
    async notifyOwnerNewBooking(ownerLineId: string, data: {
        renterName: string;
        itemTitle: string;
        startDate: string;
        endDate: string;
        totalDays: number;
        totalPrice: number;
    }): Promise<boolean> {
        const message =
            `📦 มีคำขอจองใหม่!\n\n` +
            `ผู้เช่า: ${data.renterName}\n` +
            `สินค้า: ${data.itemTitle}\n` +
            `วันที่: ${data.startDate} - ${data.endDate} (${data.totalDays} วัน)\n` +
            `ราคารวม: ฿${data.totalPrice.toLocaleString()}\n\n` +
            `กรุณาเข้าสู่ระบบเพื่อยืนยันหรือปฏิเสธคำขอ`;

        return this.sendMessage(ownerLineId, message);
    }

    /** แจ้งผู้เช่าเมื่อเจ้าของยืนยันการจอง */
    async notifyRenterBookingConfirmed(renterLineId: string, data: {
        itemTitle: string;
        startDate: string;
        endDate: string;
        ownerName: string;
    }): Promise<boolean> {
        const message =
            `✅ การจองได้รับการยืนยันแล้ว!\n\n` +
            `สินค้า: ${data.itemTitle}\n` +
            `วันที่: ${data.startDate} - ${data.endDate}\n` +
            `เจ้าของ: ${data.ownerName}\n\n` +
            `กรุณาติดต่อเจ้าของเพื่อนัดรับสินค้า`;

        return this.sendMessage(renterLineId, message);
    }

    /** แจ้งผู้เช่าเมื่อเจ้าของปฏิเสธการจอง */
    async notifyRenterBookingRejected(renterLineId: string, data: {
        itemTitle: string;
        reason?: string;
    }): Promise<boolean> {
        const message =
            `❌ การจองถูกปฏิเสธ\n\n` +
            `สินค้า: ${data.itemTitle}\n` +
            (data.reason ? `เหตุผล: ${data.reason}\n` : '') +
            `\nคุณสามารถค้นหาสินค้าอื่นได้ที่แอป`;

        return this.sendMessage(renterLineId, message);
    }

    /** แจ้งผู้เช่าเมื่อการจองถูกปฏิเสธอัตโนมัติ (หมดเวลา 24h) */
    async notifyRenterAutoRejected(renterLineId: string, data: {
        itemTitle: string;
    }): Promise<boolean> {
        const message =
            `⏰ การจองหมดอายุอัตโนมัติ\n\n` +
            `สินค้า: ${data.itemTitle}\n\n` +
            `เจ้าของไม่ได้ตอบรับภายใน 24 ชั่วโมง การจองจึงถูกยกเลิกอัตโนมัติ\n` +
            `คุณสามารถลองจองใหม่หรือค้นหาสินค้าอื่นได้`;

        return this.sendMessage(renterLineId, message);
    }

    /** แจ้งเจ้าของเมื่อผู้เช่ายกเลิกการจอง */
    async notifyOwnerBookingCancelled(ownerLineId: string, data: {
        renterName: string;
        itemTitle: string;
        startDate: string;
    }): Promise<boolean> {
        const message =
            `🚫 ผู้เช่ายกเลิกการจอง\n\n` +
            `ผู้เช่า: ${data.renterName}\n` +
            `สินค้า: ${data.itemTitle}\n` +
            `วันที่เช่า: ${data.startDate}\n\n` +
            `สินค้าของคุณพร้อมให้เช่าอีกครั้งแล้ว`;

        return this.sendMessage(ownerLineId, message);
    }
}
