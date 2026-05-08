import { Inject, Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.js';
import { RulesService } from '../rules/rules.service.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(AppConfigService)
    private readonly appConfigService: AppConfigService,
    @Inject(RulesService)
    private readonly rulesService: RulesService
  ) {}

  @Get()
  getHealth(): {
    status: 'ok';
    app: 'dnd-app-backend';
    transport: 'fastify';
    environment: string;
  } {
    return {
      status: 'ok',
      app: 'dnd-app-backend',
      transport: 'fastify',
      environment: this.appConfigService.environment
    };
  }

  @Get('ready')
  async getReadiness(): Promise<{
    status: 'ready';
    app: 'dnd-app-backend';
    rulesData: 'ok';
    rulesDataDir: string;
  }> {
    try {
      await this.rulesService.getCatalog('classes');
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'RULES_DATA_UNAVAILABLE',
        message: 'The local compacted rules dataset is not available for backend reads.'
      });
    }

    return {
      status: 'ready',
      app: 'dnd-app-backend',
      rulesData: 'ok',
      rulesDataDir: this.appConfigService.rulesDataDir
    };
  }
}
