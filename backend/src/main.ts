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
