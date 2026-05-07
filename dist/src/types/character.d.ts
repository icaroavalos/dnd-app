/**
 * Types para Character e estados relacionados
 */
export interface SpellChoiceRule {
    id: string;
    name: string;
    type: string;
    cantrips: number;
    level1Spells: number;
    spellList?: string;
    totalMax?: number;
    spellsMax?: number;
}
export interface BgSpellGrant {
    type: 'magic_initiate';
    spellList: string;
    cantrips: number;
    level1Spells: number;
}
export interface BackgroundSpellRule {
    id: string;
    name: string;
    type: 'bg_spell_choice';
    spellList: string;
    cantrips: number;
    level1Spells: number;
}
export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export interface SpellDetail {
    name: string;
    level: number;
    school?: string;
    castingTime?: string;
    range?: string;
    components?: string;
    duration?: string;
}
export interface ClassData {
    name: string;
    source: string;
    hitDie: number;
    proficiency: string[];
    savingThrows: string[];
    spellcastingAbility?: string;
    casterProgression?: string;
    cantripProgression: number[];
    preparedSpellsProgression: number[][];
    startingProficiencies: {
        skills?: {
            choose: {
                from: string[];
                count: number;
            };
        };
    };
    proficiency_choices?: ProficiencyChoice[];
    classTableGroups?: ClassTableGroup[];
}
export interface ClassTableGroup {
    colLabels: string[];
    rows: (number | string | {
        value?: number | string;
        max?: number;
    })[][];
}
export interface ProficiencyChoice {
    choose: number;
    from: string[];
    type: string;
}
export interface RaceData {
    name: string;
    source: string;
    ability: Partial<Record<string, number>>;
    traits: TraitData[];
}
export interface TraitData {
    name: string;
    entries: string[];
}
export interface BackgroundData {
    name: string;
    source: string;
    skillProficiencies: string[];
    toolProficiencies?: string[];
    languages?: string[];
    equipment: string[];
    feature?: {
        name: string;
        entries: string[];
    };
    entries?: any[];
    feats?: Record<string, boolean>[];
}
export interface ItemData {
    name: string;
    source: string;
    type: string;
    value: number;
    weight: number;
}
export interface FeatureData {
    name: string;
    source: string;
    className: string;
    classSource: string;
    level: number;
    category: string;
    ability: string[];
    prerequisite: unknown;
    type: string;
    entries: string[];
    body?: string;
    subclassShortName?: string;
    subclassSource?: string;
}
export interface SubclassData {
    name: string;
    className: string;
    source: string;
    features?: FeatureData[];
    subclassFeatures?: string[];
    shortName?: string;
    classSource?: string;
}
//# sourceMappingURL=character.d.ts.map