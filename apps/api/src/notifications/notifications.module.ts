import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LineNotifyService } from './line-notify.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsController } from './notifications.controller';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'smartrentshare-secret',
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [NotificationsController],
    providers: [LineNotifyService, NotificationsService, NotificationsGateway],
    exports: [LineNotifyService, NotificationsService],
})
export class NotificationsModule { }
