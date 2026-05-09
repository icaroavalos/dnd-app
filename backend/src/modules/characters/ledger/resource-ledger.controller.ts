import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query } from '@nestjs/common';
import { ResourceLedgerService } from './resource-ledger.service.js';

/**
 * Controller para operações de recursos e descansos via ledger.
 * Eventos: RESOURCE_USED, REST_APPLIED, AMMO_SPENT, AMMO_RECOVERED, HP_CHANGE, HIT_DIE, SPELL_SLOT
 */
@Controller('characters/:characterId/resources')
export class ResourceLedgerController {
  constructor(
    @Inject(ResourceLedgerService)
    private readonly ledgerService: ResourceLedgerService,
  ) {}

  // ==================== Legacy endpoints (compatibilidade) ====================

  @Post('damage')
  @HttpCode(201)
  async applyDamage(
    @Param('characterId') characterId: string,
    @Body() dto: LegacyDamageDto,
  ): Promise<any> {
    const entry = await this.ledgerService.hpChange(
      characterId,
      -dto.amount,
      'damage',
      dto.description,
    );
    return { event: entry, newHp: dto.currentHp - dto.amount };
  }

  @Post('heal')
  @HttpCode(201)
  async applyHealing(
    @Param('characterId') characterId: string,
    @Body() dto: LegacyHealDto,
  ): Promise<any> {
    const entry = await this.ledgerService.hpChange(
      characterId,
      dto.amount,
      'healing',
      dto.description,
    );
    return { event: entry, newHp: dto.currentHp + dto.amount };
  }

  @Post('short-rest')
  @HttpCode(201)
  async shortRest(
    @Param('characterId') characterId: string,
    @Body() dto: LegacyShortRestDto,
  ): Promise<any> {
    const entry = await this.ledgerService.shortRest(
      characterId,
      dto.hitDiceSpent,
      dto.hpRegained,
      dto.description,
    );
    return { event: entry, hpRegained: dto.hpRegained, hitDiceSpent: dto.hitDiceSpent };
  }

  @Post('long-rest')
  @HttpCode(201)
  async longRest(
    @Param('characterId') characterId: string,
    @Body() dto: LegacyLongRestDto,
  ): Promise<any> {
    const entry = await this.ledgerService.longRest(
      characterId,
      dto.hpRegained,
      dto.description,
    );
    return { event: entry, hpRegained: dto.hpRegained };
  }

  // ==================== Novos endpoints ====================

  /**
   * Histórico de eventos do ledger.
   */
  @Get('ledger')
  @HttpCode(200)
  async getLedger(@Param('characterId') characterId: string): Promise<any> {
    return this.ledgerService.getHistory(characterId);
  }

  /**
   * Filtra eventos por tipo.
   */
  @Get('ledger/events')
  @HttpCode(200)
  async getLedgerByEvent(
    @Param('characterId') characterId: string,
    @Query('event') eventType: string,
  ): Promise<any> {
    return this.ledgerService.getByEventType(characterId, eventType);
  }

  /**
   * RESOURCE_USED - Usa um recurso genérico.
   */
  @Post('use-resource')
  @HttpCode(201)
  async useResource(
    @Param('characterId') characterId: string,
    @Body() dto: UseResourceDto,
  ): Promise<any> {
    const entry = await this.ledgerService.resourceUsed(
      characterId,
      dto.resourceType,
      dto.amount,
      dto.source,
      dto.description,
      dto.metadata,
    );
    return { event: entry };
  }

  /**
   * REST_APPLIED - Aplica descanso (short ou long).
   */
  @Post('rest')
  @HttpCode(201)
  async applyRest(
    @Param('characterId') characterId: string,
    @Body() dto: RestDto,
  ): Promise<any> {
    const entry = await this.ledgerService.restApplied(
      characterId,
      dto.restType,
      dto.hpRegained,
      dto.hitDiceRegained,
      dto.description,
    );
    return { event: entry };
  }

  /**
   * AMMO_SPENT - Gasta munição.
   */
  @Post('ammo/spend')
  @HttpCode(201)
  async spendAmmo(
    @Param('characterId') characterId: string,
    @Body() dto: AmmoDto,
  ): Promise<any> {
    const entry = await this.ledgerService.ammoSpent(
      characterId,
      dto.itemId,
      dto.quantity,
      dto.source,
      dto.description,
    );
    return { event: entry };
  }

  /**
   * AMMO_RECOVERED - Recupera munição.
   */
  @Post('ammo/recover')
  @HttpCode(201)
  async recoverAmmo(
    @Param('characterId') characterId: string,
    @Body() dto: AmmoDto,
  ): Promise<any> {
    const entry = await this.ledgerService.ammoRecovered(
      characterId,
      dto.itemId,
      dto.quantity,
      dto.source,
      dto.description,
    );
    return { event: entry };
  }

  /**
   * HP_CHANGE - Aplica dano ou cura.
   */
  @Post('hp')
  @HttpCode(201)
  async applyHpChange(
    @Param('characterId') characterId: string,
    @Body() dto: HpDto,
  ): Promise<any> {
    const entry = await this.ledgerService.hpChange(
      characterId,
      dto.amount,
      dto.source,
      dto.description,
    );
    return { event: entry, newHp: dto.currentHp + dto.amount };
  }

  /**
   * HIT_DIE - Usa dado de vida.
   */
  @Post('hit-die')
  @HttpCode(201)
  async useHitDie(
    @Param('characterId') characterId: string,
    @Body() dto: HitDieDto,
  ): Promise<any> {
    const entry = await this.ledgerService.hitDieChange(
      characterId,
      dto.amount,
      dto.source,
      dto.description,
    );
    return { event: entry };
  }

  /**
   * SPELL_SLOT - Usa slot de magia.
   */
  @Post('spell-slot')
  @HttpCode(201)
  async useSpellSlot(
    @Param('characterId') characterId: string,
    @Body() dto: SpellSlotDto,
  ): Promise<any> {
    const entry = await this.ledgerService.spellSlotChange(
      characterId,
      dto.slotLevel,
      dto.description,
    );
    return { event: entry };
  }
}

interface UseResourceDto {
  resourceType: string;
  amount: number;
  source: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface RestDto {
  restType: 'short' | 'long';
  hpRegained: number;
  hitDiceRegained?: number;
  description?: string;
}

interface AmmoDto {
  itemId: string;
  quantity: number;
  source: string;
  description?: string;
}

interface HpDto {
  amount: number;
  currentHp: number;
  source: 'damage' | 'healing' | 'temp_hp';
  description?: string;
}

interface HitDieDto {
  amount: number;
  source: 'short_rest' | 'healing';
  description?: string;
}

interface SpellSlotDto {
  slotLevel: number;
  description?: string;
}

// Legacy interfaces para compatibilidade
interface LegacyDamageDto {
  amount: number;
  currentHp: number;
  description?: string;
}

interface LegacyHealDto {
  amount: number;
  currentHp: number;
  description?: string;
}

interface LegacyShortRestDto {
  hitDiceSpent: number;
  hpRegained: number;
  description?: string;
}

interface LegacyLongRestDto {
  hpRegained: number;
  description?: string;
}
