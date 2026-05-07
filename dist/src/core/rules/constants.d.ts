export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type AbilityDefinition = readonly [AbilityKey, string];
export type SkillName = 'Athletics' | 'Acrobatics' | 'Sleight of Hand' | 'Stealth' | 'Arcana' | 'History' | 'Investigation' | 'Nature' | 'Religion' | 'Animal Handling' | 'Insight' | 'Medicine' | 'Perception' | 'Survival' | 'Deception' | 'Intimidation' | 'Performance' | 'Persuasion';
export type SkillDefinition = readonly [SkillName, AbilityKey];
export type ClassId = 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter' | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer' | 'warlock' | 'wizard';
export type RaceId = 'dragonborn' | 'dwarf' | 'elf' | 'gnome' | 'half-elf' | 'half-orc' | 'halfling' | 'human' | 'tiefling';
export type BackgroundName = 'Acolyte' | 'Criminal' | 'Folk Hero' | 'Guild Artisan' | 'Hermit' | 'Noble' | 'Outlander' | 'Sage' | 'Sailor' | 'Soldier';
export type AlignmentName = 'Lawful Good' | 'Neutral Good' | 'Chaotic Good' | 'Lawful Neutral' | 'Neutral' | 'Chaotic Neutral' | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil';
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
export declare const DATA_SOURCE: "data/5etools/5e-2024";
export declare const DATA_SOURCE_LABEL: "5etools 2024";
export declare const ABILITIES: readonly AbilityDefinition[];
export declare const SKILLS: readonly SkillDefinition[];
export declare const CLASSES: readonly ClassId[];
export declare const RACES: readonly RaceId[];
export declare const SUBRACES: Readonly<Record<string, readonly string[]>>;
export declare const BACKGROUNDS: readonly BackgroundName[];
export declare const ALIGNMENT_OPTIONS: readonly (readonly [AlignmentName, AlignmentName])[];
export declare const DEFAULT_CREATION_BACKGROUNDS: readonly BackgroundName[];
export declare const CLASS_HIT_DIE: Readonly<Record<ClassId, number>>;
export declare const CLASS_SKILLS: Readonly<Record<ClassId, ClassSkillRule>>;
export declare const RACE_TRAITS: Readonly<Record<RaceId, readonly string[]>>;
export declare const STARTER_ATTACKS: Readonly<Record<'monk' | 'fighter' | 'rogue', readonly StarterAttackDefinition[]>>;
export declare const HALF_CASTER: Set<ClassId>;
export declare const CLASS_DECKS: Readonly<Partial<Record<ClassId, string>>>;
export declare const DECK_LABELS: Readonly<Record<string, string>>;
export declare const TABS: readonly TabDefinition[];
//# sourceMappingURL=constants.d.ts.map