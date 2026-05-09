import { Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { ResourceProjectionService } from './resource-projection.service.js';

/**
 * Controller para read model de recursos.
 * Fornece visão projetada/consolidada dos recursos do personagem.
 */
@Controller('characters/:characterId/resources/projection')
export class ResourceProjectionController {
  constructor(
    @Inject(ResourceProjectionService)
    private readonly projectionService: ResourceProjectionService,
  ) {}

  /**
   * Projeta/reprojeta todos os eventos do ledger.
   */
  @Post('rebuild')
  @HttpCode(200)
  async rebuildProjection(@Param('characterId') characterId: string): Promise<any> {
    const result = await this.projectionService.projectCharacterResources(characterId);
    return { ...result, projected: true };
  }

  /**
   * Busca o read model atual dos recursos.
   */
  @Get()
  @HttpCode(200)
  async getResources(@Param('characterId') characterId: string): Promise<any> {
    const resources = await this.projectionService.getResources(characterId);

    if (!resources) {
      // Se não existe, projeta
      return this.projectionService.projectCharacterResources(characterId);
    }

    return resources;
  }
}
