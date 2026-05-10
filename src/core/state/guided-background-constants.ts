/**
 * Guided Background Builder Constants
 *
 * Constantes e interfaces para backgrounds guiados.
 */

import type { AbilityName } from '../../types/background.js';

export const SUPPORTED_GUIDED_BACKGROUNDS: readonly string[] = [];

export const ABILITY_LABELS: Record<AbilityName, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

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

export interface GuidedBackgroundSource {
  backgroundOptions?: [string, string][];
  backgroundDetails?: Record<string, any>;
}

export interface GuidedBackgroundDefinition {
  name: string;
  abilityOptions: AbilityName[];
  skills: string[];
  tools: string[];
  equipmentOptionAHint: string;
  equipmentOptionBHint: string;
  showsMagicInitiate: boolean;
  magicInitiateClass: string | null;
}
