import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/index.js';

/**
 * Serviço de ledger para recursos e descansos.
 * Implementa event sourcing para:
 * - RESOURCE_USED: uso de recursos gerais
 * - REST_APPLIED: aplicação de descanso (short/long)
 * - AMMO_SPENT: gasto de munição
 * - AMMO_RECOVERED: recuperação de munição
 * - HP_CHANGE: mudança de HP (dano, cura)
 * - HIT_DIE: uso de dado de vida
 * - SPELL_SLOT: uso de slot de magia
 */
@Injectable()
export class ResourceLedgerService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  /**
   * RESOURCE_USED - Registra uso de recurso genérico.
   */
  async resourceUsed(
    characterId: string,
    resourceType: string,
    amount: number,
    source: string,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<LedgerEntry> {
    return this.createEntry({
      characterId,
      eventType: 'RESOURCE_USED',
      resourceType,
      amount: -Math.abs(amount), // negativo = gasto
      source,
      description,
      metadata,
    });
  }

  /**
   * REST_APPLIED - Registra aplicação de descanso.
   */
  async restApplied(
    characterId: string,
    restType: 'short' | 'long',
    hpRegained: number,
    hitDiceRegained?: number,
    description?: string,
  ): Promise<LedgerEntry> {
    return this.createEntry({
      characterId,
      eventType: 'REST_APPLIED',
      resourceType: restType === 'short' ? 'hit_die' : 'hp',
      amount: hpRegained + (hitDiceRegained || 0),
      source: restType === 'short' ? 'short_rest' : 'long_rest',
      description: description || `${restType === 'short' ? 'Short' : 'Long'} rest applied`,
      metadata: { restType, hpRegained, hitDiceRegained },
    });
  }

  /**
   * AMMO_SPENT - Registra gasto de munição.
   */
  async ammoSpent(
    characterId: string,
    itemId: string,
    quantity: number,
    source: string,
    description?: string,
  ): Promise<LedgerEntry> {
    return this.createEntry({
      characterId,
      eventType: 'AMMO_SPENT',
      resourceType: 'ammo',
      amount: -Math.abs(quantity),
      source,
      description: description || `Spent ${quantity} ${itemId}`,
      metadata: { itemId, quantity },
    });
  }

  /**
   * AMMO_RECOVERED - Registra recuperação de munição.
   */
  async ammoRecovered(
    characterId: string,
    itemId: string,
    quantity: number,
    source: string,
    description?: string,
  ): Promise<LedgerEntry> {
    return this.createEntry({
      characterId,
      eventType: 'AMMO_RECOVERED',
      resourceType: 'ammo',
      amount: quantity,
      source,
      description: description || `Recovered ${quantity} ${itemId}`,
      metadata: { itemId, quantity },
    });
  }

  /**
   * HP_CHANGE - Registra mudança de HP.
   */
  async hpChange(
    characterId: string,
    amount: number,
    source: 'damage' | 'healing' | 'temp_hp',
    description?: string,
  ): Promise<LedgerEntry> {
    return this.createEntry({
      characterId,
      eventType: 'HP_CHANGE',
      resourceType: 'hp',
      amount,
      source,
      description,
    });
  }

  /**
   * HIT_DIE - Registra uso de dado de vida.
   */
  async hitDieChange(
    characterId: string,
    amount: number,
    source: 'short_rest' | 'healing',
    description?: string,
  ): Promise<LedgerEntry> {
    return this.createEntry({
      characterId,
      eventType: 'HIT_DIE',
      resourceType: 'hit_die',
      amount,
      source,
      description,
    });
  }

  /**
   * SPELL_SLOT - Registra uso de slot de magia.
   */
  async spellSlotChange(
    characterId: string,
    slotLevel: number,
    description?: string,
  ): Promise<LedgerEntry> {
    return this.createEntry({
      characterId,
      eventType: 'SPELL_SLOT',
      resourceType: 'spell_slot',
      amount: slotLevel,
      source: 'spell_cast',
      description: description || `Used spell slot level ${slotLevel}`,
    });
  }

  /**
   * Short rest convenience method.
   */
  async shortRest(
    characterId: string,
    hitDiceSpent: number,
    hpRegained: number,
    description?: string,
  ): Promise<LedgerEntry> {
    await this.hitDieChange(characterId, -hitDiceSpent, 'short_rest', description);
    return this.restApplied(characterId, 'short', hpRegained, hitDiceSpent, description);
  }

  /**
   * Long rest convenience method.
   */
  async longRest(
    characterId: string,
    hpRegained: number,
    description?: string,
  ): Promise<LedgerEntry> {
    return this.restApplied(characterId, 'long', hpRegained, undefined, description);
  }

  /**
   * Busca todas as entradas do ledger de um personagem.
   */
  async getHistory(characterId: string, limit = 50): Promise<LedgerEntry[]> {
    const entries = await this.prisma.resourceLedgerEntry.findMany({
      where: { characterId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return entries.map((e) => this.toLedgerEntry(e));
  }

  /**
   * Busca entradas por tipo de evento.
   */
  async getByEventType(characterId: string, eventType: string, limit = 50): Promise<LedgerEntry[]> {
    const entries = await this.prisma.resourceLedgerEntry.findMany({
      where: { characterId, eventType },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return entries.map((e) => this.toLedgerEntry(e));
  }

  private async createEntry(input: CreateLedgerInput): Promise<LedgerEntry> {
    const character = await this.prisma.character.findUnique({
      where: { id: input.characterId },
    });

    if (!character) {
      throw new NotFoundException(`Character ${input.characterId} not found`);
    }

    const entry = await this.prisma.resourceLedgerEntry.create({
      data: {
        characterId: input.characterId,
        eventType: input.eventType,
        resourceType: input.resourceType,
        amount: input.amount,
        source: input.source,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    return this.toLedgerEntry(entry);
  }

  private toLedgerEntry(data: any): LedgerEntry {
    return {
      id: data.id,
      characterId: data.characterId,
      eventType: data.eventType,
      resourceType: data.resourceType,
      amount: data.amount,
      source: data.source,
      description: data.description,
      metadata: data.metadata ? JSON.parse(data.metadata) : null,
      createdAt: data.createdAt,
    };
  }
}

export interface LedgerEntry {
  id: string;
  characterId: string;
  eventType: string;
  resourceType: string;
  amount: number;
  source: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

interface CreateLedgerInput {
  characterId: string;
  eventType: string;
  resourceType: string;
  amount: number;
  source: string;
  description?: string;
  metadata?: Record<string, any>;
}
