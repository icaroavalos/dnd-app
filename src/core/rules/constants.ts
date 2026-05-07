export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type AbilityDefinition = readonly [AbilityKey, string];

export type SkillName =
  | 'Athletics'
  | 'Acrobatics'
  | 'Sleight of Hand'
  | 'Stealth'
  | 'Arcana'
  | 'History'
  | 'Investigation'
  | 'Nature'
  | 'Religion'
  | 'Animal Handling'
  | 'Insight'
  | 'Medicine'
  | 'Perception'
  | 'Survival'
  | 'Deception'
  | 'Intimidation'
  | 'Performance'
  | 'Persuasion';

export type SkillDefinition = readonly [SkillName, AbilityKey];

export type ClassId =
  | 'barbarian'
  | 'bard'
  | 'cleric'
  | 'druid'
  | 'fighter'
  | 'monk'
  | 'paladin'
  | 'ranger'
  | 'rogue'
  | 'sorcerer'
  | 'warlock'
  | 'wizard';

export type RaceId =
  | 'dragonborn'
  | 'dwarf'
  | 'elf'
  | 'gnome'
  | 'half-elf'
  | 'half-orc'
  | 'halfling'
  | 'human'
  | 'tiefling';

export type BackgroundName =
  | 'Acolyte'
  | 'Criminal'
  | 'Folk Hero'
  | 'Guild Artisan'
  | 'Hermit'
  | 'Noble'
  | 'Outlander'
  | 'Sage'
  | 'Sailor'
  | 'Soldier';

export type AlignmentName =
  | 'Lawful Good'
  | 'Neutral Good'
  | 'Chaotic Good'
  | 'Lawful Neutral'
  | 'Neutral'
  | 'Chaotic Neutral'
  | 'Lawful Evil'
  | 'Neutral Evil'
  | 'Chaotic Evil';

export type TabId = 'summary' | 'skills' | 'attacks' | 'spells' | 'inventory' | 'features';
export type TabDefinition = readonly [TabId, string];

export interface ClassSkillRule {
  choose: number;
  options: readonly SkillName[];
}

export interface StarterAttackDefinition {
  name: string;
  range: string;
  type: string;
  damage: string;
}

export const DATA_SOURCE = 'data/5etools/5e-2024' as const;
export const DATA_SOURCE_LABEL = '5etools 2024' as const;

export const ABILITIES: readonly AbilityDefinition[] = [
  ['str', 'Strength'],
  ['dex', 'Dexterity'],
  ['con', 'Constitution'],
  ['int', 'Intelligence'],
  ['wis', 'Wisdom'],
  ['cha', 'Charisma'],
] as const;

export const SKILLS: readonly SkillDefinition[] = [
  ['Athletics', 'str'],
  ['Acrobatics', 'dex'],
  ['Sleight of Hand', 'dex'],
  ['Stealth', 'dex'],
  ['Arcana', 'int'],
  ['History', 'int'],
  ['Investigation', 'int'],
  ['Nature', 'int'],
  ['Religion', 'int'],
  ['Animal Handling', 'wis'],
  ['Insight', 'wis'],
  ['Medicine', 'wis'],
  ['Perception', 'wis'],
  ['Survival', 'wis'],
  ['Deception', 'cha'],
  ['Intimidation', 'cha'],
  ['Performance', 'cha'],
  ['Persuasion', 'cha'],
] as const;

export const CLASSES: readonly ClassId[] = [
  'barbarian',
  'bard',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'warlock',
  'wizard',
] as const;

export const RACES: readonly RaceId[] = [
  'dragonborn',
  'dwarf',
  'elf',
  'gnome',
  'half-elf',
  'half-orc',
  'halfling',
  'human',
  'tiefling',
] as const;

export const SUBRACES: Readonly<Record<string, readonly string[]>> = {
  dragonborn: ['Dragonborn'],
  dwarf: ['Hill Dwarf', 'Mountain Dwarf'],
  elf: ['High Elf', 'Wood Elf', 'Dark Elf'],
  gnome: ['Forest Gnome', 'Rock Gnome'],
  'half-elf': ['Half Elf'],
  'half-orc': ['Half Orc'],
  halfling: ['Lightfoot Halfling', 'Stout Halfling'],
  human: ['Human'],
  tiefling: ['Tiefling'],
  Turtle: ['Turtle'],
} as const;

export const BACKGROUNDS: readonly BackgroundName[] = [
  'Acolyte',
  'Criminal',
  'Folk Hero',
  'Guild Artisan',
  'Hermit',
  'Noble',
  'Outlander',
  'Sage',
  'Sailor',
  'Soldier',
] as const;

export const ALIGNMENT_OPTIONS: readonly (readonly [AlignmentName, AlignmentName])[] = [
  ['Lawful Good', 'Lawful Good'],
  ['Neutral Good', 'Neutral Good'],
  ['Chaotic Good', 'Chaotic Good'],
  ['Lawful Neutral', 'Lawful Neutral'],
  ['Neutral', 'Neutral'],
  ['Chaotic Neutral', 'Chaotic Neutral'],
  ['Lawful Evil', 'Lawful Evil'],
  ['Neutral Evil', 'Neutral Evil'],
  ['Chaotic Evil', 'Chaotic Evil'],
] as const;

export const DEFAULT_CREATION_BACKGROUNDS: readonly BackgroundName[] = ['Acolyte', 'Soldier'] as const;

export const CLASS_HIT_DIE: Readonly<Record<ClassId, number>> = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
} as const;

const ALL_SKILL_NAMES = SKILLS.map(([name]) => name) as SkillName[];

export const CLASS_SKILLS: Readonly<Record<ClassId, ClassSkillRule>> = {
  barbarian: { choose: 2, options: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'] },
  bard: { choose: 3, options: ALL_SKILL_NAMES },
  cleric: { choose: 2, options: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'] },
  druid: { choose: 2, options: ['Arcana', 'Animal Handling', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'] },
  fighter: { choose: 2, options: ['Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight', 'Intimidation', 'Perception', 'Survival'] },
  monk: { choose: 2, options: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'] },
  paladin: { choose: 2, options: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'] },
  ranger: { choose: 3, options: ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'] },
  rogue: { choose: 4, options: ['Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation', 'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth'] },
  sorcerer: { choose: 2, options: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'] },
  warlock: { choose: 2, options: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'] },
  wizard: { choose: 2, options: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'] },
} as const;

export const RACE_TRAITS: Readonly<Record<RaceId, readonly string[]>> = {
  dragonborn: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
  dwarf: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Tool Proficiency'],
  elf: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'],
  gnome: ['Darkvision', 'Gnome Cunning'],
  'half-elf': ['Darkvision', 'Fey Ancestry', 'Skill Versatility'],
  'half-orc': ['Darkvision', 'Relentless Endurance', 'Savage Attacks'],
  halfling: ['Lucky', 'Brave', 'Halfling Nimbleness'],
  human: ['Extra Language', 'Versatile Ability Scores'],
  tiefling: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
} as const;

export const STARTER_ATTACKS: Readonly<Record<'monk' | 'fighter' | 'rogue', readonly StarterAttackDefinition[]>> = {
  monk: [
    { name: 'Shortsword', range: '5 feet', type: 'Piercing', damage: '1d6' },
    { name: 'Dart', range: '20/60', type: 'Piercing', damage: '1d4' },
    { name: 'Unarmed Strike', range: '5 feet', type: 'Bludgeoning', damage: '1d4' },
  ],
  fighter: [
    { name: 'Longsword', range: '5 feet', type: 'Slashing', damage: '1d8' },
    { name: 'Light Crossbow', range: '80/320', type: 'Piercing', damage: '1d8' },
  ],
  rogue: [
    { name: 'Rapier', range: '5 feet', type: 'Piercing', damage: '1d8' },
    { name: 'Shortbow', range: '80/320', type: 'Piercing', damage: '1d6' },
  ],
} as const;

export const HALF_CASTER = new Set<ClassId>(['paladin', 'ranger']);

export const CLASS_DECKS: Readonly<Partial<Record<ClassId, string>>> = {
  bard: 'bard',
  cleric: 'cleric',
  druid: 'druid',
  paladin: 'paladin',
  ranger: 'ranger',
  warlock: 'warlock',
  sorcerer: 'arcane',
  wizard: 'arcane',
} as const;

export const DECK_LABELS: Readonly<Record<string, string>> = {
  arcane: 'Arcane',
  bard: 'Bard',
  cleric: 'Cleric',
  druid: 'Druid',
  paladin: 'Paladin',
  ranger: 'Ranger',
  warlock: 'Warlock',
} as const;

export const TABS: readonly TabDefinition[] = [
  ['summary', 'Base'],
  ['skills', 'Skills'],
  ['attacks', 'Ataques'],
  ['spells', 'Magia'],
  ['inventory', 'Inventory'],
  ['features', 'Features'],
] as const;
