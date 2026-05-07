/**
 * Tipos para o estado global da aplicação
 * Baseado na estrutura atual do app.js
 */
import type { SpellDetail, ClassData, RaceData, BackgroundData, ItemData, FeatureData, SubclassData } from './character.js';
import type { BackgroundChoiceState } from './background.js';
export type BuilderStepId = 'lineage' | 'background' | 'abilities' | 'choices' | 'leveling';
/**
 * Dados da API/5etools
 */
export interface ApiState {
    classes: Record<string, ClassData>;
    levels: Record<string, unknown>;
    races: Record<string, RaceData>;
    spells: string[];
    classSpells: Record<string, {
        name: string;
        level: number;
        source: string;
    }[]>;
    spellDetails: Record<string, SpellDetail>;
    source: {
        classOptions: [string, string][];
        raceOptions: [string, string][];
        backgroundOptions: [string, string][];
        backgroundDetails: Record<string, BackgroundData>;
        subraceDetails: Record<string, RaceData>;
        itemDetails: Record<string, ItemData>;
        classFeatures: FeatureData[];
        subclassFeatures: FeatureData[];
        subclasses: SubclassData[];
        featDetails: Record<string, FeatureData>;
        spellDetails: Record<string, SpellDetail>;
    };
}
/**
 * Os 6 ability scores
 */
export interface AbilityScores {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}
/**
 * Attack data structure
 */
export interface Attack {
    name: string;
    range: string;
    type: string;
    damage: string;
}
/**
 * Estado do character (app.js:207-242)
 */
export interface Character {
    name: string;
    class: string;
    level: number;
    race: string;
    subrace: string;
    background: string;
    alignment: string;
    experience: number;
    abilityMethod: 'standard' | 'pointBuy' | 'manual';
    classFeatureChoices: Record<string, string>;
    asiChoices: Record<string, any>;
    equipmentChoices: Record<string, string>;
    inventory: string[];
    equippedItems: string[];
    hitDiceUsed: number;
    spellSlots: Record<string, number>;
    resources: Record<string, unknown>;
    tempHp: number;
    creationComplete: boolean;
    hp: number;
    maxHp?: number;
    armorClass: number;
    speed: number;
    abilities: AbilityScores;
    savingThrows: string[];
    classSkillChoices: string[];
    skillProficiencies: string[];
    attacks: Attack[];
    spells: string[];
    notes: string;
    bgSpellChoices?: Record<string, string[]>;
    bgChoices?: BackgroundChoiceState | null;
}
/**
 * Estado da UI
 */
export interface UiState {
    step: BuilderStepId;
    tab: string;
    builderVisible: boolean;
    levelUpMode: boolean;
    levelUpFrom: number;
    levelUpHpBase: number;
    levelUpHpGain: number;
    levelUpSnapshot: Character | null;
    levelUpClassMode: 'same' | 'multiclass';
    hpModalOpen: boolean;
    hpModalMode: 'damage' | 'heal' | 'temp';
    hpModalAmount: number;
    restModalOpen: boolean;
    restModalType: 'short' | 'long' | null;
    restModalContent: unknown;
    validationMessage: string;
}
/**
 * Estado completo da aplicação
 * Reflete a estrutura do estado global em app.js
 */
export interface AppState {
    step: BuilderStepId;
    tab: string;
    dataStatus: 'local' | 'remote';
    derived: unknown;
    selectedSpell: string;
    actionFilter: string;
    selectedAction: string;
    featureFilter: string;
    selectedFeature: string;
    bgSpellChoices: Record<string, string[]>;
    hpModalOpen: boolean;
    hpModalMode: string;
    hpModalAmount: number;
    hpModalTempAmount: string;
    restModalOpen: boolean;
    restModalType: string | null;
    restModalContent: unknown;
    validationMessage: string;
    builderVisible: boolean;
    levelUpMode: boolean;
    levelUpFrom: number;
    levelUpHpBase: number;
    levelUpHpGain: number;
    levelUpSnapshot: Character | null;
    levelUpClassMode: string;
    activeCharacterId: string;
    characters: Character[];
    api: ApiState;
    character: Character;
}
/**
 * Estado derivado da ficha para exibição e cálculos em combate
 */
export interface DerivedCharacterSheet {
    level: number;
    proficiencyBonus: number;
    abilityScores: AbilityScores;
    abilityModifiers: AbilityScores;
    savingThrows: Record<string, number>;
    skillBonuses: Record<string, number>;
    passivePerception: number;
    armorClass: number;
    initiative: number;
    maxHp: number;
    currentHp: number;
    tempHp: number;
    hitDie: number;
    hitDiceTotal: number;
    spellAttack: number;
    spellSaveDc: number;
    spellSlotsMax: Record<string, number>;
    encumbrance: {
        carriedWeight: number;
        carryingCapacity: number;
        encumbered: boolean;
    };
}
//# sourceMappingURL=state.d.ts.map