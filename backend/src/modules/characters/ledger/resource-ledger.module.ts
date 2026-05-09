import { Module } from '@nestjs/common';
import { ResourceLedgerController } from './resource-ledger.controller.js';
import { ResourceLedgerService } from './resource-ledger.service.js';

@Module({
  controllers: [ResourceLedgerController],
  providers: [ResourceLedgerService],
  exports: [ResourceLedgerService],
})
export class ResourceLedgerModule {}
