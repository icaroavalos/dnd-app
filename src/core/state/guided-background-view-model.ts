/**
 * Guided Background View Model
 *
 * Constroi view models para o background guiado.
 */

import { parseBackground } from '../character/background-parser.js';
import type { AbilityName, BackgroundChoiceState } from '../../types/background.js';
import {
  GuidedBackgroundViewModel,
  GuidedBackgroundSource,
  GuidedBackgroundDefinition,
  GuidedBackgroundOption,
  ABILITY_LABELS,
} from './guided-background-constants.js';
import {
  calculateGuidedBackgroundAbilityBonuses,
  formatChoiceLabel,
  formatEquipmentOption,
  cleanItemName,
  uniqueAbilities,
} from './guided-background-parsing.js';

/** Build guided background view model. */
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

function normalizeGuidedBackground(
  background: string | null | undefined,
  source?: GuidedBackgroundSource | null
): string | null {
  if (!background) return null;
  if (!source) return background;

  return getGuidedBackgroundOptions(source).some((option) => option.value === background)
    ? background
    : null;
}

function getGuidedBackgroundOptions(source?: GuidedBackgroundSource | null): { value: string; label: string }[] {
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
): any | null {
  return source?.backgroundDetails?.[backgroundName.toLowerCase()] ?? null;
}
