import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ─────────────────────────────────────────────────────
  // Development: allow localhost
  // Production: allow only FRONTEND_URL
  const allowedOrigins = [
    'http://localhost:3005',
    'https://localhost:3005',
    'http://localhost:3000',
  ];

  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // ── Global prefix (optional – uncomment if you want /api prefix) ──
  // app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 API running on port ${port} (${process.env.NODE_ENV || 'development'})`);
}
bootstrap();
