import { format5etoolsTime, format5etoolsRange, format5etoolsComponents, format5etoolsDuration, entriesToText, spellSchoolName } from '../../lib/formatter.js';
import { clean5etoolsText, titleCase } from '../../lib/utils.js';

export interface ClassSpellOption {
  name: string;
  level: number;
  source?: string;
}

export type ClassSpellMap = Record<string, ClassSpellOption[]>;

export interface SpellClassIndexEntry {
  classes: string[];
  traditions: string[];
}

export type SpellClassIndex = Map<string, SpellClassIndexEntry>;

export interface NormalizedSpellDetail {
  name: string;
  level: number;
  school?: string;
  levelLine: string;
  castingTime: string;
  range: string;
  components: string;
  componentFlags: string[];
  duration: string;
  material: string;
  description: string;
  higherLevel: string;
  concentration: boolean;
  ritual: boolean;
  saveOrAttack: string;
  damageTypes: string[];
  traditions: string[];
  classes: string[];
  source: string;
  page?: number;
  reference: string;
}

export interface SpellDetailApiLike {
  spellDetails?: Record<string, any>;
  source?: {
    spellDetails?: Record<string, any>;
  };
}

const CLASS_TRADITIONS: Record<string, string> = {
  artificer: 'Arcane',
  bard: 'Arcane',
  cleric: 'Divine',
  druid: 'Primal',
  paladin: 'Divine',
  ranger: 'Primal',
  sorcerer: 'Arcane',
  warlock: 'Arcane',
  wizard: 'Arcane',
};

const ABILITY_ABBREVIATIONS: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

function spellKey(name: string, source?: string): string {
  return `${String(name ?? '').toLowerCase()}|${String(source ?? '').toLowerCase()}`;
}

export function buildSpellClassIndex(classSpells: ClassSpellMap): SpellClassIndex {
  const index: SpellClassIndex = new Map();

  Object.entries(classSpells ?? {}).forEach(([className, spells]) => {
    const classLabel = titleCase(className);
    const tradition = CLASS_TRADITIONS[className.toLowerCase()];
    (spells ?? []).forEach((spell) => {
      const key = spellKey(spell.name, spell.source);
      const existing = index.get(key) ?? { classes: [], traditions: [] };
      if (!existing.classes.includes(classLabel)) existing.classes.push(classLabel);
      if (tradition && !existing.traditions.includes(tradition)) existing.traditions.push(tradition);
      index.set(key, existing);
    });
  });

  return index;
}

export function normalize5etoolsSpell(spell: any, classIndex: SpellClassIndex = new Map()): NormalizedSpellDetail {
  const levelLine = spell.level === 0
    ? `${spellSchoolName(spell.school)} cantrip`.trim()
    : `${spell.level}${ordinalSuffix(spell.level)}-level ${spellSchoolName(spell.school)}`.trim();
  const classEntry = classIndex.get(spellKey(spell.name, spell.source)) ?? classIndex.get(spellKey(spell.name)) ?? { classes: [], traditions: [] };
  const concentration = Boolean(Array.isArray(spell.duration) && spell.duration.some((entry: any) => entry?.concentration));
  const ritual = Boolean(spell.meta?.ritual);
  const componentFlags = [
    spell.components?.v ? 'V' : null,
    spell.components?.s ? 'S' : null,
    spell.components?.m ? 'M' : null,
  ].filter(Boolean) as string[];

  return {
    name: spell.name,
    level: spell.level,
    school: spell.school,
    levelLine,
    castingTime: format5etoolsTime(spell.time),
    range: format5etoolsRange(spell.range),
    components: format5etoolsComponents(spell.components),
    componentFlags,
    duration: format5etoolsDuration(spell.duration),
    material: typeof spell.components?.m === 'string'
      ? clean5etoolsText(spell.components.m)
      : clean5etoolsText(spell.components?.m?.text),
    description: entriesToText(spell.entries),
    higherLevel: entriesToText(spell.entriesHigherLevel),
    concentration,
    ritual,
    saveOrAttack: deriveSaveOrAttackLabel(spell),
    damageTypes: (spell.damageInflict ?? []).map((type: string) => titleCase(type)),
    traditions: [...(classEntry.traditions ?? [])].sort(),
    classes: [...(classEntry.classes ?? [])].sort(),
    source: spell.source,
    page: Number.isFinite(spell.page) ? spell.page : undefined,
    reference: `${spell.source}${Number.isFinite(spell.page) ? ` • p. ${spell.page}` : ''}`,
  };
}

export function resolveSpellDetail(name: string, api: SpellDetailApiLike): any | null {
  const loaded = api.spellDetails?.[name];
  if (loaded?.name) return loaded;

  const sourceDetail = api.source?.spellDetails?.[String(name).toLowerCase()];
  if (sourceDetail?.name) return sourceDetail;

  return null;
}

function deriveSaveOrAttackLabel(spell: any): string {
  const savingThrow = Array.isArray(spell.savingThrow) ? spell.savingThrow[0] : null;
  if (savingThrow) return `${ABILITY_ABBREVIATIONS[String(savingThrow).toLowerCase()] ?? String(savingThrow).toUpperCase()} Save`;

  const spellAttack = Array.isArray(spell.spellAttack) ? spell.spellAttack : [];
  if (spellAttack.includes('M')) return 'Melee Spell Attack';
  if (spellAttack.includes('R')) return 'Ranged Spell Attack';
  if (spellAttack.length) return 'Spell Attack';
  return '-';
}

function ordinalSuffix(level: number): string {
  if (level === 1) return 'st';
  if (level === 2) return 'nd';
  if (level === 3) return 'rd';
  return 'th';
}
