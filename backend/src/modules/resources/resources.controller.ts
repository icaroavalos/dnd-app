import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';

import type { CharacterRecord } from '../../domain/contracts/index.js';
import type {
  RecoverResourcesRequest,
  UseResourceRequest
} from './resources.service.js';
import { ResourcesService } from './resources.service.js';

@Controller('resources')
export class ResourcesController {
  constructor(
    @Inject(ResourcesService)
    private readonly resourcesService: ResourcesService
  ) {}

  @Post('use')
  @HttpCode(200)
  useResource(@Body() request: UseResourceRequest): CharacterRecord {
    return this.resourcesService.useResource(request);
  }

  @Post('recover')
  @HttpCode(200)
  recoverResources(@Body() request: RecoverResourcesRequest): CharacterRecord {
    return this.resourcesService.recoverResources(request);
  }
}
