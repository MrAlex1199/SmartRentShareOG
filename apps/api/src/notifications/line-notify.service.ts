import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LineNotifyService {
    private readonly logger = new Logger(LineNotifyService.name);
    private readonly channelAccessToken: string;
    private readonly messagingApiUrl = 'https://api.line.me/v2/bot/message/push';

    private readonly frontendUrl: string;

    constructor(private configService: ConfigService) {
        this.channelAccessToken = this.configService.get<string>('LINE_CHANNEL_ACCESS_TOKEN') || '';
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://smartrent.vercel.app';
        if (!this.channelAccessToken) {
            this.logger.warn('LINE_CHANNEL_ACCESS_TOKEN is not set. LINE notifications will be disabled.');
        }
    }

    /**
     * Send a push message to a LINE user
     * @param lineUserId The LINE user ID to send the message to
     * @param message A string (sent as text) OR an array of LINE message objects (e.g. flex messages)
     */
    async sendMessage(lineUserId: string, message: string | any[]): Promise<boolean> {
        if (!this.channelAccessToken) {
            this.logger.warn(`LINE notification skipped (no token): ${typeof message === 'string' ? message : 'Flex Message'}`);
            return false;
        }

        const messages = typeof message === 'string' 
            ? [{ type: 'text', text: message }] 
            : message;

        try {
            const response = await fetch(this.messagingApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.channelAccessToken}`,
                },
                body: JSON.stringify({
                    to: lineUserId,
                    messages,
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
        bookingId?: string; // Should be added if possible for deep link
    }): Promise<boolean> {
        const fallbackText = `📦 มีคำขอจองใหม่!\n\nผู้เช่า: ${data.renterName}\nสินค้า: ${data.itemTitle}\nวันที่: ${data.startDate} - ${data.endDate} (${data.totalDays} วัน)\nราคารวม: ฿${data.totalPrice.toLocaleString()}\n\nกรุณาเข้าสู่ระบบเพื่อจัดการคำขอ`;
        
        const flexMessage = {
            type: "flex",
            altText: "📦 มีคำขอจองสินค้าใหม่",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "📦 มีคำขอจองใหม่!", weight: "bold", size: "xl", color: "#1DB446" },
                        { type: "text", text: `สินค้า: ${data.itemTitle}`, margin: "md", wrap: true },
                        { type: "text", text: `ผู้เช่า: ${data.renterName}`, size: "sm", color: "#666666", wrap: true },
                        { type: "text", text: `วันที่: ${data.startDate} - ${data.endDate}`, size: "sm", color: "#666666", wrap: true },
                        { type: "text", text: `รวม: ฿${data.totalPrice.toLocaleString()}`, size: "sm", color: "#666666", weight: "bold", margin: "sm" }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            color: "#1DB446",
                            action: {
                                type: "uri",
                                label: "ดูรายละเอียด / อนุมัติ",
                                uri: `${this.frontendUrl}/bookings/requests`
                            }
                        }
                    ]
                }
            }
        };

        return this.sendMessage(ownerLineId, [flexMessage]);
    }

    /** แจ้งผู้เช่าเมื่อเจ้าของยืนยันการจอง */
    async notifyRenterBookingConfirmed(renterLineId: string, data: {
        itemTitle: string;
        startDate: string;
        endDate: string;
        ownerName: string;
        bookingId: string;
    }): Promise<boolean> {
        const flexMessage = {
            type: "flex",
            altText: "✅ การจองได้รับการยืนยันแล้ว",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "✅ การจองได้รับการยืนยัน!", weight: "bold", size: "xl", color: "#1DB446" },
                        { type: "text", text: `สินค้า: ${data.itemTitle}`, margin: "md", wrap: true },
                        { type: "text", text: `เจ้าของ: ${data.ownerName}`, size: "sm", color: "#666666", wrap: true },
                        { type: "text", text: `วันที่: ${data.startDate} - ${data.endDate}`, size: "sm", color: "#666666", wrap: true }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            color: "#1DB446",
                            action: {
                                type: "uri",
                                label: "ดูรายละเอียด / ชำระเงิน",
                                uri: `${this.frontendUrl}/bookings/${data.bookingId}`
                            }
                        }
                    ]
                }
            }
        };

        return this.sendMessage(renterLineId, [flexMessage]);
    }

    /** แจ้งผู้เช่าเมื่อเจ้าของปฏิเสธการจอง */
    async notifyRenterBookingRejected(renterLineId: string, data: {
        itemTitle: string;
        reason?: string;
    }): Promise<boolean> {
        const flexMessage = {
            type: "flex",
            altText: "❌ การจองถูกปฏิเสธ",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "❌ การจองถูกปฏิเสธ", weight: "bold", size: "xl", color: "#FF334B" },
                        { type: "text", text: `สินค้า: ${data.itemTitle}`, margin: "md", wrap: true },
                        ...(data.reason ? [{ type: "text", text: `เหตุผล: ${data.reason}`, size: "sm", color: "#666666", wrap: true }] : []),
                        { type: "text", text: "คุณสามารถค้นหาสินค้าอื่นได้ที่แอป", size: "sm", color: "#1DB446", weight: "bold", margin: "md", wrap: true }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            color: "#000000",
                            action: {
                                type: "uri",
                                label: "ค้นหาสินค้าอื่น",
                                uri: `${this.frontendUrl}/search`
                            }
                        }
                    ]
                }
            }
        };

        return this.sendMessage(renterLineId, [flexMessage]);
    }

    /** แจ้งผู้เช่าเมื่อการจองถูกปฏิเสธอัตโนมัติ (หมดเวลา 24h) */
    async notifyRenterAutoRejected(renterLineId: string, data: {
        itemTitle: string;
    }): Promise<boolean> {
        const flexMessage = {
            type: "flex",
            altText: "⏰ การจองหมดอายุอัตโนมัติ",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "⏰ การจองหมดอายุ", weight: "bold", size: "xl", color: "#FF9900" },
                        { type: "text", text: `สินค้า: ${data.itemTitle}`, margin: "md", wrap: true },
                        { type: "text", text: "เจ้าของไม่ได้ตอบรับภายในเวลาที่กำหนด การจองจึงถูกยกเลิกอัตโนมัติ", size: "sm", color: "#666666", wrap: true, margin: "sm" }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            color: "#000000",
                            action: {
                                type: "uri",
                                label: "ลองจองใหม่ / ค้นหา",
                                uri: `${this.frontendUrl}/search`
                            }
                        }
                    ]
                }
            }
        };

        return this.sendMessage(renterLineId, [flexMessage]);
    }

    /** แจ้งเจ้าของเมื่อผู้เช่ายกเลิกการจอง */
    async notifyOwnerBookingCancelled(ownerLineId: string, data: {
        renterName: string;
        itemTitle: string;
        startDate: string;
        bookingId?: string;
    }): Promise<boolean> {
        const flexMessage = {
            type: "flex",
            altText: "🚫 ผู้เช่ายกเลิกการจอง",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "🚫 ผู้เช่ายกเลิกการจอง", weight: "bold", size: "xl", color: "#FF334B" },
                        { type: "text", text: `สินค้า: ${data.itemTitle}`, margin: "md", wrap: true },
                        { type: "text", text: `ผู้เช่า: ${data.renterName}`, size: "sm", color: "#666666", wrap: true },
                        { type: "text", text: `วันที่: ${data.startDate}`, size: "sm", color: "#666666", wrap: true },
                        { type: "text", text: "สินค้าของคุณพร้อมให้เช่าอีกครั้งแล้ว", size: "sm", color: "#1DB446", weight: "bold", margin: "md", wrap: true }
                    ]
                }
            }
        };

        return this.sendMessage(ownerLineId, [flexMessage]);
    }

    /** แจ้งเตือนเมื่อมีข้อความใหม่ใน Chat */
    async notifyNewChatMessage(lineId: string, data: {
        senderName: string;
        itemTitle: string;
        messagePreview: string;
        bookingId: string;
    }): Promise<boolean> {
        const flexMessage = {
            type: "flex",
            altText: `💬 ข้อความใหม่จาก ${data.senderName}`,
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: `💬 ข้อความจาก ${data.senderName}`, weight: "bold", size: "lg", color: "#000000" },
                        { type: "text", text: `สินค้า: ${data.itemTitle}`, size: "sm", color: "#666666", margin: "sm", wrap: true },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "md",
                            paddingAll: "md",
                            backgroundColor: "#F5F5F5",
                            cornerRadius: "md",
                            contents: [
                                { type: "text", text: data.messagePreview, size: "sm", wrap: true, color: "#333333" }
                            ]
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            color: "#000000",
                            action: {
                                type: "uri",
                                label: "เปิดหน้าแชท",
                                uri: `${this.frontendUrl}/bookings/${data.bookingId}/chat`
                            }
                        }
                    ]
                }
            }
        };

        return this.sendMessage(lineId, [flexMessage]);
    }

    /** แจ้งเตือนเมื่อผู้ใช้สมัครสมาชิกสำเร็จ (Feature 7) */
    async notifyWelcomeNewUser(lineId: string, displayName: string): Promise<boolean> {
        const fallbackText = `🎉 ยินดีต้อนรับคุณ ${displayName} สู่ SmartRent&Share!\n\nคุณสามารถลงประกาศให้เช่าสินค้า หรือค้นหาสินค้าที่ต้องการเช่าได้เลยในระบบของเรา!`;
        
        const flexMessage = {
            type: "flex",
            altText: "🎉 ยินดีต้อนรับสู่ SmartRent&Share",
            contents: {
                type: "bubble",
                direction: "ltr",
                header: {
                    type: "box",
                    layout: "vertical",
                    backgroundColor: "#1DB446",
                    contents: [
                        { type: "text", text: "SmartRent&Share", color: "#FFFFFF", weight: "bold", size: "xl", align: "center" }
                    ]
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    contents: [
                        { type: "text", text: `🎉 ยินดีต้อนรับคุณ ${displayName}!`, weight: "bold", size: "md", color: "#333333", wrap: true },
                        { type: "text", text: "ขอบคุณที่เข้าร่วมเป็นส่วนหนึ่งของคอมมูนิตี้แบ่งปันของเรา คุณสามารถเริ่มลงประกาศให้เช่าของที่คุณไม่ได้ใช้บ่อยๆ เพื่อสร้างรายได้เสริม หรือค้นหาสินค้าเพื่อเช่าใช้งานในราคาประหยัดได้เลย!", size: "sm", color: "#666666", wrap: true }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            color: "#000000",
                            action: {
                                type: "uri",
                                label: "ค้นหาสินค้า",
                                uri: `${this.frontendUrl}/search`
                            }
                        },
                        {
                            type: "button",
                            style: "secondary",
                            action: {
                                type: "uri",
                                label: "ลงประกาศให้เช่า",
                                uri: `${this.frontendUrl}/items/create`
                            }
                        }
                    ]
                }
            }
        };

        // We can also push the OA contact string if needed, but the official way is they add the bot when logging in.
        // If they receive this message, they already added the bot.
        
        return this.sendMessage(lineId, [flexMessage]);
    }
}
