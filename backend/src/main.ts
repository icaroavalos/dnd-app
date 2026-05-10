import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication
} from '@nestjs/platform-fastify';

import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { AppConfigService, loadAppConfig } from './config/app-config.js';
import { AppModule } from './app.module.js';

export async function createApp(): Promise<NestFastifyApplication> {
  const config = loadAppConfig();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: config.logLevel
      }
    })
  );

  app.useGlobalFilters(new ApiExceptionFilter());

  // Enable CORS for local development
  app.enableCors({
    origin: ['http://localhost:4173', 'http://127.0.0.1:4173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  });

  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const config = app.get(AppConfigService);

  await app.listen(config.port, config.host);
}

if (import.meta.url === new URL(process.argv[1]!, 'file:').href) {
  void bootstrap();
}
