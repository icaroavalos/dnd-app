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
export declare function buildSpellClassIndex(classSpells: ClassSpellMap): SpellClassIndex;
export declare function normalize5etoolsSpell(spell: any, classIndex?: SpellClassIndex): NormalizedSpellDetail;
export declare function resolveSpellDetail(name: string, api: SpellDetailApiLike): any | null;
//# sourceMappingURL=spell-detail.d.ts.map