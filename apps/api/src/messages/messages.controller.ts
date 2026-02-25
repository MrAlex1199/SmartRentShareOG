import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    /** GET /messages/:bookingId — โหลดประวัติ chat */
    @Get(':bookingId')
    async getMessages(@Param('bookingId') bookingId: string, @Request() req: any) {
        return this.messagesService.getMessages(bookingId, req.user.userId);
    }

    /** POST /messages/:bookingId — ส่งข้อความ (REST fallback) */
    @Post(':bookingId')
    async sendMessage(
        @Param('bookingId') bookingId: string,
        @Body('content') content: string,
        @Request() req: any,
    ) {
        return this.messagesService.createMessage(bookingId, req.user.userId, content);
    }
}
