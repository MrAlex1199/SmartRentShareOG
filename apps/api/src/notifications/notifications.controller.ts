import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getMyNotifications(@Request() req: any) {
        return this.notificationsService.findByUser(req.user.userId);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req: any) {
        const count = await this.notificationsService.getUnreadCount(req.user.userId);
        return { count };
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Request() req: any) {
        await this.notificationsService.markAsRead(id, req.user.userId);
        return { success: true };
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req: any) {
        await this.notificationsService.markAllAsRead(req.user.userId);
        return { success: true };
    }

    @Delete('clear-read')
    async clearReadNotifications(@Request() req: any) {
        return this.notificationsService.clearReadNotifications(req.user.userId);
    }
}
