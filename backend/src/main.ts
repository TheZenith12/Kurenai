import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as compression from 'compression';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Uploads directory
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });

  // Security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'wss:', 'ws:'],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Compression
  app.use(compression());

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger docs (зөвхөн dev-д)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Anime Platform API')
      .setDescription('Anime Community + Game Platform REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`Swagger docs: http://localhost:${process.env.PORT ?? 3001}/api/docs`);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`🚀 Anime Platform started on port ${port}`);
  logger.log(`📁 Uploads served at: http://localhost:${port}/uploads/`);
  logger.log(`Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
