import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/index.js';
import {
  useResource,
  applyRest,
  spendAmmo,
  recoverAmmo,
  applyHpChange,
  applyHitDieChange,
  applySpellSlotChange,
  applyShortRest,
  applyLongRest,
} from './commands/index.js';
import { getLedgerHistory, getLedgerByEventType } from './queries/index.js';

@Injectable()
export class ResourceLedgerService implements OnModuleInit {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async resourceUsed(
    characterId: string,
    resourceType: string,
    amount: number,
    source: string,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<any> {
    return useResource(this.prisma, {
      characterId,
      resourceType,
      amount,
      source,
      description,
      metadata,
    });
  }

  async restApplied(
    characterId: string,
    restType: 'short' | 'long',
    hpRegained: number,
    hitDiceRegained?: number,
    description?: string,
  ): Promise<any> {
    return applyRest(this.prisma, {
      characterId,
      restType,
      hpRegained,
      hitDiceRegained,
      description,
    });
  }

  async ammoSpent(
    characterId: string,
    itemId: string,
    quantity: number,
    source: string,
    description?: string,
  ): Promise<any> {
    return spendAmmo(this.prisma, {
      characterId,
      itemId,
      quantity,
      source,
      description,
    });
  }

  async ammoRecovered(
    characterId: string,
    itemId: string,
    quantity: number,
    source: string,
    description?: string,
  ): Promise<any> {
    return recoverAmmo(this.prisma, {
      characterId,
      itemId,
      quantity,
      source,
      description,
    });
  }

  async hpChange(
    characterId: string,
    amount: number,
    source: 'damage' | 'healing' | 'temp_hp',
    description?: string,
  ): Promise<any> {
    return applyHpChange(this.prisma, {
      characterId,
      amount,
      source,
      description,
    });
  }

  async hitDieChange(
    characterId: string,
    amount: number,
    source: 'short_rest' | 'healing',
    description?: string,
  ): Promise<any> {
    return applyHitDieChange(this.prisma, {
      characterId,
      amount,
      source,
      description,
    });
  }

  async spellSlotChange(
    characterId: string,
    slotLevel: number,
    description?: string,
  ): Promise<any> {
    return applySpellSlotChange(this.prisma, {
      characterId,
      slotLevel,
      description,
    });
  }

  async getHistory(characterId: string, limit = 50): Promise<any[]> {
    return getLedgerHistory(this.prisma, characterId, limit);
  }

  async getByEventType(characterId: string, eventType: string, limit = 50): Promise<any[]> {
    return getLedgerByEventType(this.prisma, characterId, eventType, limit);
  }

  async shortRest(
    characterId: string,
    hitDiceSpent: number,
    hpRegained: number,
    description?: string,
  ): Promise<any> {
    return applyShortRest(this.prisma, {
      characterId,
      hitDiceSpent,
      hpRegained,
      description,
    });
  }

  async longRest(
    characterId: string,
    hpRegained: number,
    description?: string,
  ): Promise<any> {
    return applyLongRest(this.prisma, {
      characterId,
      hpRegained,
      description,
    });
  }
}
