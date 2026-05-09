import { parseBackground } from '../character/background-parser.js';
import type { AbilityName, AbilityIncrementPattern, BackgroundChoiceState, RawBackground } from '../../types/background.js';

export const SUPPORTED_GUIDED_BACKGROUNDS: readonly string[] = [];

interface GuidedBackgroundSource {
  backgroundOptions?: [string, string][];
  backgroundDetails?: Record<string, RawBackground>;
}

interface GuidedBackgroundDefinition {
  name: string;
  abilityOptions: AbilityName[];
  skills: string[];
  tools: string[];
  equipmentOptionAHint: string;
  equipmentOptionBHint: string;
  showsMagicInitiate: boolean;
  magicInitiateClass: string | null;
}

export interface GuidedBackgroundOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface GuidedAbilityOption {
  value: AbilityName;
  label: string;
  selected: boolean;
  disabled: boolean;
  bonus: number;
}

export interface GuidedBackgroundViewModel {
  currentBackground: string | null;
  options: GuidedBackgroundOption[];
  abilityOptions: GuidedAbilityOption[];
  skills: string[];
  tools: string[];
  equipmentOptions: { value: 'A' | 'B'; label: string; hint: string; selected: boolean }[];
  selectedAbilityCount: number;
  maxAbilityChoices: number;
  showsMagicInitiate: boolean;
  magicInitiateClass: string | null;
  spellcastingAbility: AbilityName | null;
}

const ABILITY_LABELS: Record<AbilityName, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export function createGuidedBackgroundChoiceState(background: string): BackgroundChoiceState {
  return {
    background,
    source: 'XPHB',
    abilityIncrement: null,
    abilityScores: [],
    skillChoices: [],
    toolChoices: [],
    equipmentChoice: null,
    spellcastingAbility: null,
  };
}

export function ensureGuidedBackgroundChoiceState(
  bgChoices: BackgroundChoiceState | null | undefined,
  backgroundFallback?: string | null,
  source?: GuidedBackgroundSource | null
): BackgroundChoiceState {
  const normalizedBackground = normalizeGuidedBackground(bgChoices?.background ?? backgroundFallback, source);

  return {
    background: normalizedBackground,
    source: bgChoices?.source ?? 'XPHB',
    abilityIncrement: bgChoices?.abilityIncrement ?? null,
    abilityScores: Array.isArray(bgChoices?.abilityScores) ? [...bgChoices.abilityScores] : [],
    skillChoices: Array.isArray(bgChoices?.skillChoices) ? [...bgChoices.skillChoices] : [],
    toolChoices: Array.isArray(bgChoices?.toolChoices) ? [...bgChoices.toolChoices] : [],
    equipmentChoice: bgChoices?.equipmentChoice ?? null,
    spellcastingAbility: bgChoices?.spellcastingAbility ?? null,
  };
}

export function buildGuidedBackgroundViewModel(
  bgChoices?: BackgroundChoiceState | null,
  source?: GuidedBackgroundSource | null
): GuidedBackgroundViewModel {
  const backgroundName = normalizeGuidedBackground(bgChoices?.background, source);
  const background = backgroundName ? getGuidedBackgroundDefinition(backgroundName, source) : null;
  const selectedAbilityCount = Array.isArray(bgChoices?.abilityScores) ? bgChoices.abilityScores.length : 0;
  const maxAbilityChoices = bgChoices?.abilityIncrement === '2_1' ? 2 : bgChoices?.abilityIncrement === '1_1_1' ? 3 : 0;
  const bonuses = calculateGuidedBackgroundAbilityBonuses(bgChoices ?? null);

  return {
    currentBackground: backgroundName,
    options: getGuidedBackgroundOptions(source).map((option) => ({
      ...option,
      selected: option.value === backgroundName,
    })),
    abilityOptions: (background?.abilityOptions ?? []).map((ability) => {
      const selected = Boolean(bgChoices?.abilityScores?.includes(ability));
      const disabled = !bgChoices?.abilityIncrement || (!selected && maxAbilityChoices > 0 && selectedAbilityCount >= maxAbilityChoices);
      return {
        value: ability,
        label: ABILITY_LABELS[ability],
        selected,
        disabled,
        bonus: bonuses[ability] ?? 0,
      };
    }),
    skills: background?.skills ?? [],
    tools: background?.tools ?? [],
    equipmentOptions: [
      {
        value: 'A',
        label: 'Option A',
        hint: background?.equipmentOptionAHint ?? 'Items based on background',
        selected: bgChoices?.equipmentChoice === 'A',
      },
      {
        value: 'B',
        label: 'Option B',
        hint: background?.equipmentOptionBHint ?? '50 GP gold',
        selected: bgChoices?.equipmentChoice === 'B',
      },
    ],
    selectedAbilityCount,
    maxAbilityChoices,
    showsMagicInitiate: Boolean(background?.showsMagicInitiate),
    magicInitiateClass: background?.magicInitiateClass ?? null,
    spellcastingAbility: bgChoices?.spellcastingAbility ?? null,
  };
}

export function applyGuidedBackgroundIncrement(
  bgChoices: BackgroundChoiceState,
  increment: AbilityIncrementPattern
): BackgroundChoiceState {
  const next = ensureGuidedBackgroundChoiceState(bgChoices);
  const maxChoices = increment === '2_1' ? 2 : 3;
  return {
    ...next,
    abilityIncrement: increment,
    abilityScores: (next.abilityScores ?? []).slice(0, maxChoices),
  };
}

export function toggleGuidedBackgroundAbility(
  bgChoices: BackgroundChoiceState,
  ability: AbilityName,
  checked: boolean
): BackgroundChoiceState {
  const next = ensureGuidedBackgroundChoiceState(bgChoices);
  const current = [...(next.abilityScores ?? [])];
  const maxChoices = next.abilityIncrement === '2_1' ? 2 : next.abilityIncrement === '1_1_1' ? 3 : 0;

  if (!checked) {
    return {
      ...next,
      abilityScores: current.filter((item) => item !== ability),
    };
  }

  if (current.includes(ability)) return next;
  if (maxChoices > 0 && current.length >= maxChoices) return next;

  return {
    ...next,
    abilityScores: [...current, ability],
  };
}

export function applyGuidedBackgroundEquipmentChoice(
  bgChoices: BackgroundChoiceState | null | undefined,
  equipmentChoice: 'A' | 'B'
): BackgroundChoiceState {
  const next = ensureGuidedBackgroundChoiceState(bgChoices);
  return {
    ...next,
    equipmentChoice,
  };
}

export function applyGuidedBackgroundSpellcastingAbility(
  bgChoices: BackgroundChoiceState | null | undefined,
  spellcastingAbility: AbilityName
): BackgroundChoiceState {
  const next = ensureGuidedBackgroundChoiceState(bgChoices);
  return {
    ...next,
    spellcastingAbility,
  };
}

export function normalizeGuidedBackground(
  background: string | null | undefined,
  source?: GuidedBackgroundSource | null
): string | null {
  if (!background) return null;
  if (!source) return background;

  return getGuidedBackgroundOptions(source).some((option) => option.value === background)
    ? background
    : null;
}

function getGuidedBackgroundOptions(source?: GuidedBackgroundSource | null): Omit<GuidedBackgroundOption, 'selected'>[] {
  return (source?.backgroundOptions ?? [])
    .filter(([value]) => Boolean(getRawBackground(value, source)))
    .map(([value, label]) => ({ value, label }));
}

function getGuidedBackgroundDefinition(
  backgroundName: string,
  source?: GuidedBackgroundSource | null
): GuidedBackgroundDefinition | null {
  const rawBackground = getRawBackground(backgroundName, source);
  if (!rawBackground) return null;

  const parsed = parseBackground(rawBackground);
  const abilityOptions = uniqueAbilities(parsed.abilityScores.flatMap((ability) => ability.options));

  return {
    name: parsed.name,
    abilityOptions,
    skills: parsed.skillProficiencies.map(formatChoiceLabel),
    tools: parsed.toolProficiencies.map(formatChoiceLabel),
    equipmentOptionAHint: formatEquipmentOption(parsed.equipment.optionA),
    equipmentOptionBHint: formatEquipmentOption(parsed.equipment.optionB),
    showsMagicInitiate: parsed.magicInitiate !== null,
    magicInitiateClass: parsed.magicInitiate?.className ?? null,
  };
}

function getRawBackground(
  backgroundName: string,
  source?: GuidedBackgroundSource | null
): RawBackground | null {
  return source?.backgroundDetails?.[backgroundName.toLowerCase()] ?? null;
}

function uniqueAbilities(abilities: AbilityName[]): AbilityName[] {
  return [...new Set(abilities)];
}

function formatChoiceLabel(value: string): string {
  return value
    .replace(/^any([A-Z])/, '$1')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatEquipmentOption(option: {
  type: string;
  items?: { name: string; displayName?: string; quantity?: number }[];
  goldValue?: number;
}): string {
  const itemsText = (option.items ?? [])
    .map((item) => `${item.quantity ? `${item.quantity}x ` : ''}${cleanItemName(item.displayName ?? item.name)}`)
    .join(', ');
  const goldText = typeof option.goldValue === 'number' ? `${Math.floor(option.goldValue / 100)} GP` : '';

  return [itemsText, goldText].filter(Boolean).join(', ') || 'Items based on background';
}

function cleanItemName(value: string): string {
  return value.split('|')[0] ?? value;
}

function calculateGuidedBackgroundAbilityBonuses(
  bgChoices: BackgroundChoiceState | null | undefined
): Record<AbilityName, number> {
  const bonuses: Record<AbilityName, number> = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  };

  if (!bgChoices?.abilityIncrement || !Array.isArray(bgChoices.abilityScores)) return bonuses;

  const scores = bgChoices.abilityScores.filter((value): value is AbilityName =>
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(value)
  );

  if (bgChoices.abilityIncrement === '2_1' && scores.length >= 1) {
    bonuses[scores[0]] += 2;
    if (scores.length >= 2) bonuses[scores[1]] += 1;
  }

  if (bgChoices.abilityIncrement === '1_1_1' && scores.length >= 1) {
    scores.slice(0, 3).forEach((score) => {
      bonuses[score] += 1;
    });
  }

  return bonuses;
}
