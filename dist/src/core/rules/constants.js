export const DATA_SOURCE = 'data/5etools/5e-2024';
export const DATA_SOURCE_LABEL = '5etools 2024';
export const ABILITIES = [
    ['str', 'Strength'],
    ['dex', 'Dexterity'],
    ['con', 'Constitution'],
    ['int', 'Intelligence'],
    ['wis', 'Wisdom'],
    ['cha', 'Charisma'],
];
export const SKILLS = [
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
];
export const CLASSES = [
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
];
export const RACES = [
    'dragonborn',
    'dwarf',
    'elf',
    'gnome',
    'half-elf',
    'half-orc',
    'halfling',
    'human',
    'tiefling',
];
export const SUBRACES = {
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
};
export const BACKGROUNDS = [
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
];
export const ALIGNMENT_OPTIONS = [
    ['Lawful Good', 'Lawful Good'],
    ['Neutral Good', 'Neutral Good'],
    ['Chaotic Good', 'Chaotic Good'],
    ['Lawful Neutral', 'Lawful Neutral'],
    ['Neutral', 'Neutral'],
    ['Chaotic Neutral', 'Chaotic Neutral'],
    ['Lawful Evil', 'Lawful Evil'],
    ['Neutral Evil', 'Neutral Evil'],
    ['Chaotic Evil', 'Chaotic Evil'],
];
export const DEFAULT_CREATION_BACKGROUNDS = ['Acolyte', 'Soldier'];
export const CLASS_HIT_DIE = {
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
};
const ALL_SKILL_NAMES = SKILLS.map(([name]) => name);
export const CLASS_SKILLS = {
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
};
export const RACE_TRAITS = {
    dragonborn: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
    dwarf: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Tool Proficiency'],
    elf: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'],
    gnome: ['Darkvision', 'Gnome Cunning'],
    'half-elf': ['Darkvision', 'Fey Ancestry', 'Skill Versatility'],
    'half-orc': ['Darkvision', 'Relentless Endurance', 'Savage Attacks'],
    halfling: ['Lucky', 'Brave', 'Halfling Nimbleness'],
    human: ['Extra Language', 'Versatile Ability Scores'],
    tiefling: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
};
export const STARTER_ATTACKS = {
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
};
export const HALF_CASTER = new Set(['paladin', 'ranger']);
export const CLASS_DECKS = {
    bard: 'bard',
    cleric: 'cleric',
    druid: 'druid',
    paladin: 'paladin',
    ranger: 'ranger',
    warlock: 'warlock',
    sorcerer: 'arcane',
    wizard: 'arcane',
};
export const DECK_LABELS = {
    arcane: 'Arcane',
    bard: 'Bard',
    cleric: 'Cleric',
    druid: 'Druid',
    paladin: 'Paladin',
    ranger: 'Ranger',
    warlock: 'Warlock',
};
export const TABS = [
    ['summary', 'Base'],
    ['skills', 'Skills'],
    ['attacks', 'Ataques'],
    ['spells', 'Magia'],
    ['inventory', 'Inventory'],
    ['features', 'Features'],
];
//# sourceMappingURL=constants.js.map