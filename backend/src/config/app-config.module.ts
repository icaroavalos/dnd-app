import { Module } from '@nestjs/common';

import { AppConfigService } from './app-config.js';

@Module({
  providers: [AppConfigService],
  exports: [AppConfigService]
})
export class AppConfigModule {}
