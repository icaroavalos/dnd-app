import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/index.js';
import {
  resourceUsed,
  restApplied as restAppliedFn,
  ammoSpent,
  ammoRecovered,
  hpChange as hpChangeFn,
  hitDieChange as hitDieChangeFn,
  spellSlotChange,
  shortRest as shortRestFn,
  longRest as longRestFn,
} from './domain/ledger-writes.js';
import { getLedgerHistory, getLedgerByEventType } from './domain/ledger-reads.js';

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
    return resourceUsed(this.prisma, characterId, resourceType, amount, source, description, metadata);
  }

  async restApplied(
    characterId: string,
    restType: 'short' | 'long',
    hpRegained: number,
    hitDiceRegained?: number,
    description?: string,
  ): Promise<any> {
    return restAppliedFn(this.prisma, characterId, restType, hpRegained, hitDiceRegained, description);
  }

  async ammoSpent(
    characterId: string,
    itemId: string,
    quantity: number,
    source: string,
    description?: string,
  ): Promise<any> {
    return ammoSpent(this.prisma, characterId, itemId, quantity, source, description);
  }

  async ammoRecovered(
    characterId: string,
    itemId: string,
    quantity: number,
    source: string,
    description?: string,
  ): Promise<any> {
    return ammoRecovered(this.prisma, characterId, itemId, quantity, source, description);
  }

  async hpChange(
    characterId: string,
    amount: number,
    source: 'damage' | 'healing' | 'temp_hp',
    description?: string,
  ): Promise<any> {
    return hpChangeFn(this.prisma, characterId, amount, source, description);
  }

  async hitDieChange(
    characterId: string,
    amount: number,
    source: 'short_rest' | 'healing',
    description?: string,
  ): Promise<any> {
    return hitDieChangeFn(this.prisma, characterId, amount, source, description);
  }

  async spellSlotChange(
    characterId: string,
    slotLevel: number,
    description?: string,
  ): Promise<any> {
    return spellSlotChange(this.prisma, characterId, slotLevel, description);
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
    return shortRestFn(this.prisma, characterId, hitDiceSpent, hpRegained, description);
  }

  async longRest(
    characterId: string,
    hpRegained: number,
    description?: string,
  ): Promise<any> {
    return longRestFn(this.prisma, characterId, hpRegained, description);
  }
}
