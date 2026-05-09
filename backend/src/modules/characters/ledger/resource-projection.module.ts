import { Module } from '@nestjs/common';
import { ResourceProjectionController } from './resource-projection.controller.js';
import { ResourceProjectionService } from './resource-projection.service.js';

@Module({
  controllers: [ResourceProjectionController],
  providers: [ResourceProjectionService],
  exports: [ResourceProjectionService],
})
export class ResourceProjectionModule {}
