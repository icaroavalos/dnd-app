import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/index.js';

/**
 * Serviço de projeção para read model de recursos.
 * Projeta eventos do ledger em um estado consolidado.
 */
@Injectable()
export class ResourceProjectionService {
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
   * Projeta todos os eventos do ledger para o read model.
   * Usado para rebuild/refresh da projeção.
   */
  async projectCharacterResources(characterId: string): Promise<ResourceReadModel> {
    // Verifica se personagem existe
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException(`Character ${characterId} not found`);
    }

    // Busca todos os eventos do ledger
    const events = await this.prisma.resourceLedgerEntry.findMany({
      where: { characterId },
      orderBy: { createdAt: 'asc' }, // ordem cronológica para projeção correta
    });

    // Estado inicial
    const state = {
      currentHp: 10,
      tempHp: 0,
      hitDiceTotal: 0,
      hitDiceUsed: 0,
      spellSlots: {} as Record<string, number>,
      spellSlotsUsed: {} as Record<string, number>,
      generalResources: {} as Record<string, number>,
      ammo: {} as Record<string, number>,
    };

    // Projeta eventos em ordem
    for (const event of events) {
      this.applyEvent(state, event);
    }

    // Salva o read model
    const readModel = await this.prisma.resourceReadModel.upsert({
      where: { characterId },
      update: {
        currentHp: state.currentHp,
        tempHp: state.tempHp,
        hitDiceTotal: state.hitDiceTotal,
        hitDiceUsed: state.hitDiceUsed,
        spellSlots: JSON.stringify(state.spellSlots),
        spellSlotsUsed: JSON.stringify(state.spellSlotsUsed),
        generalResources: JSON.stringify(state.generalResources),
        ammo: JSON.stringify(state.ammo),
        lastUpdated: new Date(),
      },
      create: {
        characterId,
        currentHp: state.currentHp,
        tempHp: state.tempHp,
        hitDiceTotal: state.hitDiceTotal,
        hitDiceUsed: state.hitDiceUsed,
        spellSlots: JSON.stringify(state.spellSlots),
        spellSlotsUsed: JSON.stringify(state.spellSlotsUsed),
        generalResources: JSON.stringify(state.generalResources),
        ammo: JSON.stringify(state.ammo),
        lastUpdated: new Date(),
      },
    });

    return this.toResourceReadModel(readModel);
  }

  /**
   * Aplica um único evento ao estado (para atualizações incrementais).
   */
  async applySingleEvent(
    characterId: string,
    eventType: string,
    resourceType: string,
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<ResourceReadModel> {
    // Busca estado atual ou cria novo
    let state = await this.prisma.resourceReadModel.findUnique({
      where: { characterId },
    });

    const resources: ResourceState = state
      ? this.fromResourceReadModel(state)
      : {
          currentHp: 10,
          tempHp: 0,
          hitDiceTotal: 0,
          hitDiceUsed: 0,
          spellSlots: {},
          spellSlotsUsed: {},
          generalResources: {},
          ammo: {},
        };

    // Aplica evento
    this.applyEvent(resources, {
      eventType,
      resourceType,
      amount,
      metadata,
    } as any);

    // Atualiza
    const updated = await this.prisma.resourceReadModel.upsert({
      where: { characterId },
      update: {
        currentHp: resources.currentHp,
        tempHp: resources.tempHp,
        hitDiceTotal: resources.hitDiceTotal,
        hitDiceUsed: resources.hitDiceUsed,
        spellSlots: JSON.stringify(resources.spellSlots),
        spellSlotsUsed: JSON.stringify(resources.spellSlotsUsed),
        generalResources: JSON.stringify(resources.generalResources),
        ammo: JSON.stringify(resources.ammo),
        lastUpdated: new Date(),
      },
      create: {
        characterId,
        currentHp: resources.currentHp,
        tempHp: resources.tempHp,
        hitDiceTotal: resources.hitDiceTotal,
        hitDiceUsed: resources.hitDiceUsed,
        spellSlots: JSON.stringify(resources.spellSlots),
        spellSlotsUsed: JSON.stringify(resources.spellSlotsUsed),
        generalResources: JSON.stringify(resources.generalResources),
        ammo: JSON.stringify(resources.ammo),
        lastUpdated: new Date(),
      },
    });

    return this.toResourceReadModel(updated);
  }

  /**
   * Busca o read model de um personagem.
   */
  async getResources(characterId: string): Promise<ResourceReadModel | null> {
    const model = await this.prisma.resourceReadModel.findUnique({
      where: { characterId },
    });

    if (!model) return null;

    return this.toResourceReadModel(model);
  }

  private applyEvent(state: ResourceState, event: any): void {
    const { eventType, resourceType, amount, metadata } = event;
    const parsedMetadata = metadata
      ? typeof metadata === 'string'
        ? JSON.parse(metadata)
        : metadata
      : {};

    switch (eventType) {
      case 'HP_CHANGE':
        state.currentHp += amount;
        break;

      case 'HIT_DIE':
        if (amount < 0) {
          state.hitDiceUsed += Math.abs(amount);
        }
        break;

      case 'SPELL_SLOT':
        const slotLevel = String(amount); // level do slot
        state.spellSlotsUsed[slotLevel] = (state.spellSlotsUsed[slotLevel] || 0) + 1;
        break;

      case 'RESOURCE_USED':
        const resourceName = resourceType || 'unknown';
        state.generalResources[resourceName] =
          (state.generalResources[resourceName] || 0) + amount;
        break;

      case 'AMMO_SPENT':
        const itemIdSpent = parsedMetadata.itemId || resourceType || 'ammo';
        state.ammo[itemIdSpent] = (state.ammo[itemIdSpent] || 0) + amount;
        break;

      case 'AMMO_RECOVERED':
        const itemIdRecovered = parsedMetadata.itemId || resourceType || 'ammo';
        state.ammo[itemIdRecovered] = (state.ammo[itemIdRecovered] || 0) + amount;
        break;

      case 'REST_APPLIED':
        // HP regains já foram aplicados via HP_CHANGE, apenas marca
        break;
    }
  }

  private fromResourceReadModel(model: any): ResourceState {
    return {
      currentHp: model.currentHp,
      tempHp: model.tempHp,
      hitDiceTotal: model.hitDiceTotal,
      hitDiceUsed: model.hitDiceUsed,
      spellSlots: JSON.parse(model.spellSlots || '{}'),
      spellSlotsUsed: JSON.parse(model.spellSlotsUsed || '{}'),
      generalResources: JSON.parse(model.generalResources || '{}'),
      ammo: JSON.parse(model.ammo || '{}'),
    };
  }

  private toResourceReadModel(model: any): ResourceReadModel {
    return {
      id: model.id,
      characterId: model.characterId,
      currentHp: model.currentHp,
      tempHp: model.tempHp,
      hitDiceTotal: model.hitDiceTotal,
      hitDiceUsed: model.hitDiceUsed,
      spellSlots: JSON.parse(model.spellSlots || '{}'),
      spellSlotsUsed: JSON.parse(model.spellSlotsUsed || '{}'),
      generalResources: JSON.parse(model.generalResources || '{}'),
      ammo: JSON.parse(model.ammo || '{}'),
      lastUpdated: model.lastUpdated,
    };
  }
}

interface ResourceState {
  currentHp: number;
  tempHp: number;
  hitDiceTotal: number;
  hitDiceUsed: number;
  spellSlots: Record<string, number>;
  spellSlotsUsed: Record<string, number>;
  generalResources: Record<string, number>;
  ammo: Record<string, number>;
}

export interface ResourceReadModel {
  id: string;
  characterId: string;
  currentHp: number;
  tempHp: number;
  hitDiceTotal: number;
  hitDiceUsed: number;
  spellSlots: Record<string, number>;
  spellSlotsUsed: Record<string, number>;
  generalResources: Record<string, number>;
  ammo: Record<string, number>;
  lastUpdated: Date;
}
