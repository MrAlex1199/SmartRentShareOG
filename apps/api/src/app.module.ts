import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadModule } from './upload/upload.module';
import { MessagesModule } from './messages/messages.module';
import { DisputesModule } from './disputes/disputes.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    // ── Rate Limiting ────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,          // 1 second window
        limit: 20,          // max 20 requests/sec per IP
      },
      {
        name: 'medium',
        ttl: 60_000,        // 1 minute window
        limit: 200,         // max 200 requests/min per IP
      },
      {
        name: 'long',
        ttl: 15 * 60_000,   // 15 minutes window
        limit: 1000,        // max 1000 requests/15min per IP
      },
    ]),
    UsersModule,
    AuthModule,
    ItemsModule,
    BookingsModule,
    ReviewsModule,
    NotificationsModule,
    PaymentsModule,
    UploadModule,
    MessagesModule,
    DisputesModule,
    AdminModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
