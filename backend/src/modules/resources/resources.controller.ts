import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { CharacterRecord } from '@shared/contracts';
import type { RecoverResourcesRequestDto, UseResourceRequestDto } from './dto/index.js';
import { ResourcesService } from './resources.service.js';

@Controller('resources')
export class ResourcesController {
  constructor(
    @Inject(ResourcesService)
    private readonly resourcesService: ResourcesService
  ) {}

  @Post('use')
  @HttpCode(200)
  useResource(@Body() request: UseResourceRequestDto): CharacterRecord {
    return this.resourcesService.useResource(request);
  }

  @Post('recover')
  @HttpCode(200)
  recoverResources(@Body() request: RecoverResourcesRequestDto): CharacterRecord {
    return this.resourcesService.recoverResources(request);
  }
}
