/**
 * Resource Engine - Lógica para identificar e calcular usos de recursos de classe/raça
 */

import type { ApiState } from '../../types/state.js';
import { deriveProficiencyBonus } from './character-engine.js';
import { calculateCharacterAbilityBonuses } from './ability-bonuses.js';
import { deriveAbilityScores, deriveAbilityModifier } from './character-engine.js';

export interface ResourceRecovery {
  short?: 'all' | number | string;
  long?: 'all' | number | string;
}

export interface ResourceMeta {
  id: string;
  name: string;
  tableLabels: string[];
  match: RegExp;
  isCanonical?: boolean;
}

export interface ResourceDefinition {
  id: string;
  name: string;
  className?: string;
  kind?: string;
  sourceLabel?: string;
  body: string;
  level: number;
  max: number;
  recovery: ResourceRecovery;
  actionKind: string;
  isCanonical?: boolean;
}

export const RESOURCE_META: ResourceMeta[] = [
  { id: "rage", name: "Rage", tableLabels: ["Rages"], match: /^rage(?:$|[:(])/i },
  { id: "wildShape", name: "Wild Shape", tableLabels: ["Wild Shape"], match: /^wild shape(?:$|[:(])/i },
  { id: "channelDivinity", name: "Channel Divinity", tableLabels: ["Channel Divinity"], match: /^channel divinity(?:$|[:(])/i },
  { id: "secondWind", name: "Second Wind", tableLabels: ["Second Wind"], match: /^second wind(?:$|[:(])/i },
  { id: "actionSurge", name: "Action Surge", tableLabels: ["Action Surge"], match: /^action surge(?:$|[:(])/i },
  { id: "bardicInspiration", name: "Bardic Inspiration", tableLabels: [], match: /^bardic inspiration(?:$|[:(])/i },
  { id: "flashOfGenius", name: "Flash of Genius", tableLabels: [], match: /^flash of genius(?:$|[:(])/i },
  { id: "healingHands", name: "Healing Hands", tableLabels: [], match: /^healing hands(?:$|[:(])/i },
  { id: "radiantSoul", name: "Radiant Soul", tableLabels: [], match: /^radiant soul(?:$|[:(])/i },
  { id: "necroticShroud", name: "Necrotic Shroud", tableLabels: [], match: /^necrotic shroud(?:$|[:(])/i },
  { id: "furyOfTheSmall", name: "Fury of the Small", tableLabels: [], match: /^fury of the small(?:$|[:(])/i },
  { id: "relentlessEndurance", name: "Relentless Endurance", tableLabels: [], match: /^relentless endurance(?:$|[:(])/i },
  { id: "stonesEndurance", name: "Stone's Endurance", tableLabels: [], match: /^stone'?s endurance(?:$|[:(])/i },
  { id: "feyStep", name: "Fey Step", tableLabels: [], match: /^fey step(?:$|[:(])/i },
  { id: "infernalLegacy", name: "Infernal Legacy", tableLabels: [], match: /^infernal legacy(?:$|[:(])/i },
];

export function resourceRecoveryFromBody(body: string): ResourceRecovery {
  const text = String(body ?? "");
  const recovery: ResourceRecovery = {};

  if (/regain all expended uses when you finish a short rest/i.test(text)) recovery.short = "all";
  else if (/regain all your expended uses when you finish a short rest/i.test(text)) recovery.short = "all";
  else if (/regain all of (?:its|their|your) expended uses when you finish a short rest/i.test(text)) recovery.short = "all";
  else if (/regain one(?: of (?:its|their|your))? expended uses when you finish a short rest/i.test(text)) recovery.short = 1;
  else if (/regain all(?: your)? expended uses.*finish a (?:short rest(?: or long rest)?|short or long rest)/i.test(text)) recovery.short = "all";
  else if (/finish a short rest/i.test(text) && /regain all expended uses/i.test(text)) recovery.short = "all";
  else if (/finish a short rest/i.test(text) && /regain one expended use/i.test(text)) recovery.short = 1;
  else if (/short or long rest/i.test(text) && /can't use/i.test(text)) {
    recovery.short = "all";
    recovery.long = "all";
  }
  else if (/finish a short rest/i.test(text) && /can't use (?:it|this trait|this feature|this ability)/i.test(text) && /again/i.test(text)) recovery.short = "all";
  else if (/can't use this feature again until you finish a (?:Short Rest|Long Rest)/i.test(text)) {
    recovery.short = "all";
    recovery.long = "all";
  }
  else if (/finish a (?:Short Rest|Long Rest)/i.test(text) && /can't.*again/i.test(text)) {
    recovery.short = "all";
    recovery.long = "all";
  }

  if (/finish a .{0,100}Short Rest.{0,100}Long Rest/i.test(text) || /finish a .{0,100}Long Rest.{0,100}Short Rest/i.test(text)) {
    recovery.short = "all";
    recovery.long = "all";
  }
  else if (/can't do so again until you finish/i.test(text)) {
    if (/short/i.test(text)) recovery.short = "all";
    if (/long/i.test(text)) recovery.long = "all";
  }
  else if (/before a .{0,50}Short Rest/i.test(text) || /before a .{0,50}Long Rest/i.test(text)) {
    if (/short/i.test(text)) recovery.short = "all";
    if (/long/i.test(text)) recovery.long = "all";
  }
  else if (/regain one expended use when you finish a short rest/i.test(text)) {
    recovery.short = 1;
  }

  if (/regain all expended uses when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/regain all your expended uses when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/regain all of (?:its|their|your) expended uses when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/finish a long rest/i.test(text) && /regain all expended uses/i.test(text)) recovery.long = "all";
  else if (/once you use this trait/i.test(text) && /finish a long rest/i.test(text)) recovery.long = "all";
  else if (/can't use this trait again until you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/can't use (?:it|this trait|this feature|this ability) again until you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/regain the ability to cast it when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/regain the ability to do so when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/you regain the ability to cast it this way when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/you regain the ability to do so when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/you must finish a long rest in order to cast the spell again/i.test(text)) recovery.long = "all";

  return recovery;
}

export function resourceActionKindFromBody(body: string): string {
  const text = String(body ?? "").toLowerCase();
  if (text.includes("bonus action")) return "bonus";
  if (text.includes("reaction")) return "reaction";
  if (text.includes("additional action")) return "action";
  if (text.includes("as an action")) return "action";
  if (text.includes("magic action")) return "action";
  return "";
}

export function resourceRecoveryLabel(recovery: ResourceRecovery = {}): string {
  if (recovery.short && recovery.long) return "Short or Long Rest Resource";
  if (recovery.short) return "Short Rest Resource";
  if (recovery.long) return "Long Rest Resource";
  return "Limited Use Resource";
}

export function clean5etoolsText(value: string): string {
  return String(value ?? "")
    .replace(/\{@(?:spell|item|condition|skill|sense|variantrule|filter|hazard|scaledamage|damage|feat|action|book)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
    .replace(/\{@(?:dice|hit|d20|chance)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
    .replace(/\{@i\s+([^}]+)}/g, "$1")
    .replace(/\{@b\s+([^}]+)}/g, "$1")
    .replace(/\{@[^}]+\}/g, "")
    .trim();
}

export function resourceMaxFromBody(
  body: string,
  api: ApiState,
  character: any,
  level: number = 1,
  meta: ResourceMeta | null = null
): number {
  const text = String(body ?? "");
  const tableValue = meta ? classTableResourceValue(meta.tableLabels, level, api, character.class) : 0;
  if (Number.isFinite(tableValue) && tableValue > 0) return tableValue;

  if (/\bonce (?:you )?use this (?:trait|feature|ability)\b/i.test(text)) return 1;
  if (/can't use (?:it|this (?:trait|feature|ability|spell(?: again)?|trait again|ability again)|that spell) again until you finish a short or long rest/i.test(text)) return 1;
  if (/can't use (?:it|this (?:trait|feature|ability|spell(?: again)?|trait again|ability again)|that spell) again until you finish a (?:short|long) rest/i.test(text)) return 1;
  if (/once per (?:short|long) rest/i.test(text)) return 1;
  if (/regain the ability to do so when you finish a (?:short|long) rest/i.test(text)) return 1;
  if (/regain the ability to cast it when you finish a long rest/i.test(text)) return 1;

  const modifierMatch = text.match(/number of times equal to your ([A-Za-z]+) modifier/i);
  if (modifierMatch) {
    return Math.max(1, abilityModifierFromLabel(modifierMatch[1], character));
  }

  const proficiencyMatch = text.match(/(?:number of times|a number of times|uses) equal to your proficiency bonus/i);
  if (proficiencyMatch) return Math.max(1, deriveProficiencyBonus(level));

  const fixedMatch = text.match(/\b(once|twice|thrice)\b/i);
  if (fixedMatch) {
    const fixed: Record<string, number> = { once: 1, twice: 2, thrice: 3 };
    const val = fixed[fixedMatch[1].toLowerCase()];
    if (val) return val;
  }

  const numericMatch = text.match(/(?:you can use this feature|you can use this class's [^]+?|you can enter your rage|you can confer a bardic inspiration die)[^.\n]*?(\d+)\b/i);
  if (numericMatch) return Number(numericMatch[1]) || 0;

  return 0;
}

function classTableResourceValue(labels: string[], level: number, api: ApiState, charClass: string): number {
  const classData = api.classes[charClass];
  if (!classData) return 0;
  const rowIndex = Math.max(0, Number(level) - 1);
  for (const group of classData.classTableGroups ?? []) {
    const colIndex = (group.colLabels ?? []).findIndex((label) =>
      labels.some((needle) => clean5etoolsText(label).toLowerCase() === clean5etoolsText(needle).toLowerCase())
    );
    if (colIndex === -1) continue;
    const cell = group.rows?.[rowIndex]?.[colIndex];
    return parseTableCellValue(cell);
  }
  return 0;
}

function parseTableCellValue(cell: any): number {
  if (cell == null) return 0;
  if (typeof cell === "number") return cell;
  if (typeof cell === "string") {
    const cleaned = clean5etoolsText(cell);
    if (!cleaned || cleaned === "—" || /^unlimited$/i.test(cleaned)) return 0;
    const numeric = Number(cleaned.replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  if (typeof cell === "object") {
    if (typeof cell.value === "number") return cell.value;
    if (typeof cell.value === "string") return parseTableCellValue(cell.value);
    if (typeof cell.max === "number") return cell.max;
  }
  return 0;
}

function abilityModifierFromLabel(label: string, character: any): number {
  const normalized = String(label ?? "").toLowerCase();
  const abilityMap: Record<string, any> = {
    charisma: "cha",
    constitution: "con",
    dexterity: "dex",
    intelligence: "int",
    strength: "str",
    wisdom: "wis",
    cha: "cha",
    con: "con",
    dex: "dex",
    int: "int",
    str: "str",
    wis: "wis",
  };
  const key = abilityMap[normalized];
  if (!key) return deriveProficiencyBonus(character.level);

  const bonuses = calculateCharacterAbilityBonuses(character);
  const scores = deriveAbilityScores(character.abilities ?? {}, bonuses);
  return deriveAbilityModifier(scores[key as keyof typeof scores]);
}
