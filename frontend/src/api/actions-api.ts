import { apiClient } from './api-client';
import type { Character } from '../types/character';

export type DerivedActionKind = 'attack' | 'action' | 'bonus' | 'reaction' | 'other' | 'limited';

export interface DerivedActionCost {
  economy?: DerivedActionKind | 'free';
  resource?: string;
  slotLevel?: number | null;
}

export interface DerivedAction {
  id: string;
  kind: DerivedActionKind;
  icon?: string;
  name: string;
  subtitle?: string;
  range?: string;
  rangeLabel?: string;
  hit?: string;
  damage?: string[];
  notes?: string;
  detail?: string;
  cost?: DerivedActionCost;
  resource?: string;
  slotLevel?: number | null;
  source?: Record<string, unknown>;
  disabled?: boolean;
}

export class ActionsApiError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ActionsApiError';
  }
}

export async function deriveActions(character: Character): Promise<DerivedAction[]> {
  try {
    const response = await apiClient.post<DerivedAction[]>('/actions/derive', toActionsCharacterRecord(character));
    return response.data;
  } catch (error) {
    throw new ActionsApiError('Falha ao carregar ações derivadas do backend.', error);
  }
}

function toActionsCharacterRecord(character: Character): Record<string, unknown> {
  const classes = Array.isArray((character as any).classes) && (character as any).classes.length > 0
    ? (character as any).classes
    : character.class
      ? [{ classId: slugify(character.class), level: character.level || 1 }]
      : [];

  return {
    ...character,
    id: character.id || 'frontend-character',
    ruleset: '5e-2024',
    lineageId: slugify(character.race),
    backgroundId: slugify(character.background),
    classes,
    abilities: normalizeAbilities(character.abilities),
    skillProficiencies: character.skillProficiencies || [],
    savingThrowProficiencies: character.savingThrows || [],
    inventory: character.inventory || [],
    spellChoices: (character.spells || []).map((spell: any) => ({
      spellId: spell.id || spell.name,
      spellcastingAbility: character.bgChoices?.spellcastingAbility,
    })),
    resources: character.resources || {},
    state: {
      hp: character.hp || 0,
      maxHpOverride: character.maxHp || null,
      tempHp: character.tempHp || 0,
      hitDiceUsed: character.hitDiceUsed || 0,
      spellSlotsUsed: Object.fromEntries(
        Object.entries(character.spellSlots || {}).map(([level, slot]: [string, any]) => [level, slot?.used || 0])
      ),
      activeConditions: [],
    },
  };
}

function normalizeAbilities(abilities: Character['abilities']): Record<string, number> {
  return {
    str: Number(abilities?.str ?? 10),
    dex: Number(abilities?.dex ?? 10),
    con: Number(abilities?.con ?? 10),
    int: Number(abilities?.int ?? 10),
    wis: Number(abilities?.wis ?? 10),
    cha: Number(abilities?.cha ?? 10),
  };
}

function slugify(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
