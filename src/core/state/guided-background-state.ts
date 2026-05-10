/**
 * Guided Background Builder State
 *
 * Gerencia estado e transicoes do background guiado.
 */

import type { AbilityName, AbilityIncrementPattern, BackgroundChoiceState } from '../../types/background.js';

/** Create initial guided background choice state. */
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

/** Ensure guided background choice state is valid. */
export function ensureGuidedBackgroundChoiceState(
  bgChoices: BackgroundChoiceState | null | undefined,
  backgroundFallback?: string | null,
  source?: { backgroundOptions?: [string, string][]; backgroundDetails?: Record<string, any> } | null
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

/** Normalize background against source catalog. */
export function normalizeGuidedBackground(
  background: string | null | undefined,
  source?: { backgroundOptions?: [string, string][]; backgroundDetails?: Record<string, any> } | null
): string | null {
  if (!background) return null;
  if (!source) return background;

  return getGuidedBackgroundOptions(source).some((option) => option.value === background)
    ? background
    : null;
}

/** Get list of guided background options from source. */
function getGuidedBackgroundOptions(source?: { backgroundOptions?: [string, string][]; backgroundDetails?: Record<string, any> } | null): { value: string; label: string }[] {
  return (source?.backgroundOptions ?? [])
    .filter(([value]) => Boolean(getRawBackground(value, source)))
    .map(([value, label]) => ({ value, label }));
}

/** Get raw background data from source. */
function getRawBackground(
  backgroundName: string,
  source?: { backgroundOptions?: [string, string][]; backgroundDetails?: Record<string, any> } | null
): any | null {
  return source?.backgroundDetails?.[backgroundName.toLowerCase()] ?? null;
}

/** Apply ability increment pattern to background. */
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

/** Toggle ability selection for background. */
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

/** Apply equipment choice to background. */
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

/** Apply spellcasting ability to background. */
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
