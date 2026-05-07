/**
 * Spell Engine - Lógica para derivação de magias, slots e métricas de conjuração
 */

import type { Character, ApiState } from '../../types/state.js';
import type { SpellDetail } from '../../types/character.js';
import {
  deriveProficiencyBonus,
  deriveSpellcastingMetrics as deriveBaseMetrics
} from './character-engine.js';
import {
  getSelectedBackgroundSpellNames,
  resolveBackgroundSpellcastingAbility,
  createBackgroundSpellRules,
  getBackgroundGrantedSpells
} from '../../lib/magic-initiate-validator.js';

import { calculateCharacterAbilityBonuses } from './ability-bonuses.js';
import { deriveAbilityScores, deriveAbilityModifier } from './character-engine.js';

export interface SpellcastingMetrics {
  ability: string;
  modifier: number;
  attackBonus: number;
  saveDc: number;
}

export interface SpellChoiceStatus {
  cantrips: number;
  spellsMax: number;
  totalMax: number;
  label: string;
  hint: string;
}

export function currentKnownSpellNames(
  character: Character,
  api: ApiState,
  activeFeatures: any[] = []
): string[] {
  const explicit = [...new Set(character.spells ?? [])];
  const autoGranted = autoGrantedSpellEntries(character, api, activeFeatures).map((spell) => spell.name);
  const backgroundSelected = getSelectedBackgroundSpellNames(
    character.bgSpellChoices,
    backgroundSpellChoiceRules(character, api)
  );

  return [...new Set([...explicit, ...autoGranted, ...backgroundSelected])];
}

export function resolveSelectedSpellName(selectedSpell: string, spellNames: string[]): string {
  if (selectedSpell && spellNames.includes(selectedSpell)) return selectedSpell;
  return spellNames[0] ?? '';
}

export function currentLevelRow(character: Character, api: ApiState) {
  const levels = api.levels[character.class];
  return Array.isArray(levels) ? levels.find((l: any) => l.level === character.level) : undefined;
}

export function classHasSpellList(className: string, api: ApiState): boolean {
  return (api.classSpells?.[className] ?? []).length > 0;
}

export function casterLevel(character: Character, api: ApiState): number {
  const className = character.class;
  const progression = api.classes[className]?.casterProgression;
  if (!classHasSpellList(className, api)) return 0;
  if (progression === "artificer") return Math.max(0, Math.ceil(character.level / 2));
  if (progression === "pact") return character.level;

  const halfCasters = ["paladin", "ranger"];
  if (halfCasters.includes(className.toLowerCase())) return Math.max(0, Math.floor(character.level / 2));
  return character.level;
}

export function classSpellAbility(className: string, api: ApiState): string {
  const apiAbility = api.classes[className]?.spellcastingAbility;
  if (apiAbility) return apiAbility.toLowerCase();

  const ability: Record<string, string> = {
    bard: "cha",
    cleric: "wis",
    druid: "wis",
    paladin: "cha",
    ranger: "wis",
    sorcerer: "cha",
    warlock: "cha",
    wizard: "int",
    monk: "wis",
  };
  return ability[className.toLowerCase()] ?? "int";
}

export function backgroundSpellChoiceRules(character: Character, api: ApiState) {
  const background = character.background || character.bgChoices?.background;
  const grants = getBackgroundGrantedSpells(background || undefined, api.source?.backgroundDetails);
  return createBackgroundSpellRules(grants);
}

export function backgroundSpellAbility(character: Character, api: ApiState): string | null {
  const rules = backgroundSpellChoiceRules(character, api);
  return resolveBackgroundSpellcastingAbility(character.bgChoices, rules);
}

export function spellAbility(character: Character, api: ApiState): string {
  if (classHasSpellList(character.class, api)) {
    return classSpellAbility(character.class, api);
  }
  return backgroundSpellAbility(character, api) ?? classSpellAbility(character.class, api);
}

export function spellAbilityForSpell(
  spellName: string,
  character: Character,
  api: ApiState,
  bgSpellNames: string[]
): string {
  const bgAbility = backgroundSpellAbility(character, api);
  if (bgAbility && bgSpellNames.includes(spellName)) return bgAbility;
  return classHasSpellList(character.class, api)
    ? classSpellAbility(character.class, api)
    : bgAbility ?? classSpellAbility(character.class, api);
}

export function spellcastingMetricsForAbility(
  ability: string,
  character: Character,
  derivedSheet?: any
): SpellcastingMetrics {
  const proficiencyBonus = derivedSheet?.proficiencyBonus ?? deriveProficiencyBonus(character.level);
  const bonuses = calculateCharacterAbilityBonuses(character);
  const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
  const normalizedAbility = (ability.toLowerCase() || 'int') as keyof typeof scores;
  const score = scores[normalizedAbility] || 10;
  const modifier = deriveAbilityModifier(score);

  return {
    ability: normalizedAbility,
    modifier,
    attackBonus: proficiencyBonus + modifier,
    saveDc: 8 + proficiencyBonus + modifier,
  };
}

export function spellSlotsMaxByLevel(character: Character, api: ApiState): Record<number, number> {
  const levelRow = currentLevelRow(character, api);
  const spellcasting = levelRow?.spellcasting ?? {};

  const slots: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) {
    const val = Number(spellcasting[`spell_slots_level_${i}`]) || 0;
    if (val > 0) slots[i] = val;
  }
  return slots;
}

export function explicitSpellRefsFromText(text: string): string[] {
  return [...String(text ?? "").matchAll(/\{@spell ([^|}]+)(?:\|[^}]*)?\}/gi)]
    .map((match) => clean5etoolsText(match[1]).trim())
    .filter(Boolean);
}

function clean5etoolsText(value: string): string {
  return String(value ?? "")
    .replace(/\{@(?:spell|item|condition|skill|sense|variantrule|filter|hazard|scaledamage|damage|feat|action|book)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
    .replace(/\{@(?:dice|hit|d20|chance)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
    .replace(/\{@i\s+([^}]+)}/g, "$1")
    .replace(/\{@b\s+([^}]+)}/g, "$1")
    .replace(/\{@[^}]+\}/g, "")
    .trim();
}

export function autoGrantedSpellEntries(character: Character, api: ApiState, activeFeatures: any[]) {
  const grants = new Map();
  const choicePattern = /(choose|choice|of your choice|of your choosing)/i;

  activeFeatures.forEach((feature) => {
    const body = String(feature.body ?? "");
    const refs = explicitSpellRefsFromText(body);
    if (!refs.length) return;
    if (choicePattern.test(body) && !/(you know|always have|prepared)/i.test(body)) return;

    const spellDetails = api.source?.spellDetails ?? {};
    refs.forEach((spellName) => {
      const spell = spellDetails[spellName.toLowerCase()];
      if (!spell?.name) return;
      grants.set(spell.name, {
        name: spell.name,
        level: Number(spell.level) || 0,
        origin: feature.name,
        sourceLabel: feature.meta,
      });
    });
  });

  return [...grants.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export function spellFromKnownData(name: string, api: ApiState) {
  const detail = api.spellDetails?.[name];
  if (detail && Number.isFinite(detail.level)) return { name, level: detail.level };

  const sourceDetail = api.source?.spellDetails?.[String(name).toLowerCase()];
  if (sourceDetail && Number.isFinite(sourceDetail.level)) {
    return { name: sourceDetail.name, level: sourceDetail.level };
  }

  return { name, level: Infinity };
}
