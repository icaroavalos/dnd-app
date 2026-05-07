import type { Character } from '../../types/state';
export declare const ALIGNMENT_OPTIONS: readonly [readonly ["Lawful Good", "Lawful Good"], readonly ["Neutral Good", "Neutral Good"], readonly ["Chaotic Good", "Chaotic Good"], readonly ["Lawful Neutral", "Lawful Neutral"], readonly ["Neutral", "Neutral"], readonly ["Chaotic Neutral", "Chaotic Neutral"], readonly ["Lawful Evil", "Lawful Evil"], readonly ["Neutral Evil", "Neutral Evil"], readonly ["Chaotic Evil", "Chaotic Evil"]];
export declare const DEFAULT_CREATION_BACKGROUNDS: readonly ["Acolyte", "Soldier"];
export type CreationFieldPath = 'class' | 'race' | 'subrace' | 'alignment' | 'background';
export interface CreationFieldHelpers {
    backgroundSkillProficiencies: (backgroundName: string) => string[];
    defaultSaves: (className: string) => string[];
    defaultSubrace: (raceName: string) => string;
    maxLevelOneHp: (className: string, abilities: Character['abilities']) => number;
}
export declare function updateCreationField(character: Character, path: CreationFieldPath, value: string, helpers: CreationFieldHelpers): Character;
export declare function applyBackgroundStepSelection(character: Character, backgroundName: string, backgroundSkillProficiencies?: (backgroundName: string) => string[]): Character;
//# sourceMappingURL=creation-form-controller.d.ts.map