/**
 * Types for Background system - loading from 5etools and character creation
 */

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

// ============================================================================
// Existing Types (preserved)
// ============================================================================

export interface BackgroundData {
  name: string;
  source: string;
  description?: string;
  skillProficiencies?: string[];
  toolProficiencies?: string[];
  languages?: string[];
  equipment?: string[];
  feature?: {
    name: string;
    entries: string[];
  };
  spells?: string[];
}

export interface BackgroundOption {
  value: string;
  label: string;
  description?: string;
  source: string;
}

export interface BackgroundSelectorConfig {
  availableBackgrounds: BackgroundOption[];
  locked?: boolean;
  onSelect?: (background: string) => void;
}

// ============================================================================
// 5etools Raw Types (for loading JSON data)
// ============================================================================

export interface RawBackgroundAbility {
  choose?: {
    weighted?: {
      from: string[];
      weights: number[];
    };
    from?: string[];
    count?: number;
  };
}

export interface RawBackground {
  name: string;
  source: string;
  page?: number;
  ability?: RawBackgroundAbility[];
  skillProficiencies?: Record<string, boolean>[];
  toolProficiencies?: Record<string, boolean>[];
  languageProficiencies?: ({ anyStandard?: number } | string)[];
  startingEquipment?: {
    A?: unknown[];
    B?: unknown[];
    _?: unknown[];
  }[];
  feats?: Record<string, boolean>[];
  entries?: unknown[];
  srd52?: boolean;
  basicRules2024?: boolean;
}

// ============================================================================
// Parsed Types (after processing from raw)
// ============================================================================

export interface ParsedAbility {
  options: AbilityName[];
  weights?: number[];
  type: 'weighted' | 'choose';
}

export interface EquipmentItem {
  name: string;
  displayName?: string;
  quantity?: number;
  special?: string;
}

export interface EquipmentOption {
  type: 'items' | 'gold' | 'mixed';
  items?: EquipmentItem[];
  goldValue?: number;
}

export interface MagicInitiateInfo {
  className: string;
  source: string;
}

export interface ParsedBackground {
  name: string;
  source: string;
  page?: number;
  abilityScores: ParsedAbility[];
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number | string[];
  equipment: {
    optionA: EquipmentOption;
    optionB: EquipmentOption;
  };
  feat: string | null;
  magicInitiate: MagicInitiateInfo | null;
}

// ============================================================================
// Rule Types (for UI rendering)
// ============================================================================

export interface BackgroundRuleOption {
  value: string;
  label: string;
  hint?: string;
}

export interface BackgroundRule {
  id: string;
  name: string;
  type: 'ability' | 'skill' | 'tool' | 'equipment';
  summary: string;
  options: BackgroundRuleOption[];
  required: number;
}

// ============================================================================
// Choice State Types
// ============================================================================

export type AbilityIncrementPattern = '2_1' | '1_1_1';

export interface BackgroundChoiceState {
  background: string | null;
  source: string;
  abilityIncrement: AbilityIncrementPattern | null;
  abilityScores: AbilityName[];
  skillChoices: string[];
  toolChoices: string[];
  equipmentChoice: 'A' | 'B' | null;
  spellcastingAbility: AbilityName | null;
}

export function getDefaultBackgroundChoice(): BackgroundChoiceState {
  return {
    background: null,
    source: 'XPHB',
    abilityIncrement: null,
    abilityScores: [],
    skillChoices: [],
    toolChoices: [],
    equipmentChoice: null,
    spellcastingAbility: null,
  };
}

export function validateBackgroundChoices(state: BackgroundChoiceState): string[] {
  const missing: string[] = [];

  if (!state.background) {
    missing.push('background');
    return missing;
  }

  if (!state.abilityScores.length) {
    missing.push('ability scores');
  }

  if (!state.equipmentChoice) {
    missing.push('equipment');
  }

  return missing;
}

export function applyBackgroundChoices(
  choices: BackgroundChoiceState
): {
  background: string;
  bgChoices: BackgroundChoiceState;
} {
  if (!choices.background) {
    throw new Error('No background selected');
  }

  return {
    background: choices.background,
    bgChoices: choices,
  };
}