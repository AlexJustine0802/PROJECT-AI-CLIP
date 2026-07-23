import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // Security hardening.
  app.use(helmet());
  app.enableCors({ origin: config.get<string>('webUrl'), credentials: true });

  // URI versioning: everything lives under /api/v1 (v2 ready).
  app.setGlobalPrefix('api', { exclude: ['health', 'live', 'ready', 'metrics'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Validation (SQLi/XSS defense via strict DTO whitelisting + transformation).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // OpenAPI → also feeds SDK generation.
  const swagger = new DocumentBuilder()
    .setTitle('ClipForge API')
    .setDescription('REST API for the ClipForge video-to-shorts platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  const port = config.get<number>('port')!;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.error(`ClipForge API listening on :${port} (docs at /api/docs, graphql at /graphql)`);
}

void bootstrap();
