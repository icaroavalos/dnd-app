/**
 * Guided Background Parsing
 *
 * Funcoes de parsing e formatacao para backgrounds.
 */

import type { AbilityName } from '../../types/background.js';

export function calculateGuidedBackgroundAbilityBonuses(
  bgChoices: { abilityIncrement: string | null; abilityScores: AbilityName[] | null | undefined } | null | undefined
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

export function uniqueAbilities(abilities: AbilityName[]): AbilityName[] {
  return [...new Set(abilities)];
}

export function formatChoiceLabel(value: string): string {
  return value
    .replace(/^any([A-Z])/, '$1')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatEquipmentOption(option: {
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

export function cleanItemName(value: string): string {
  return value.split('|')[0] ?? value;
}
