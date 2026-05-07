import type { Character } from '../../types/state.js';
export { ALIGNMENT_OPTIONS, DEFAULT_CREATION_BACKGROUNDS } from '../rules/constants.js';
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