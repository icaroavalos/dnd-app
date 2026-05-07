import type { BuilderStepId } from '../../types/state';
export declare const CREATION_STEPS: [BuilderStepId, string][];
type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export interface CreationFlowCharacter {
    name?: string;
    class?: string;
    race?: string;
    subrace?: string;
    background?: string;
    abilityMethod?: 'standard' | 'pointBuy' | 'manual' | string;
    abilities: Record<AbilityKey, number>;
    classSkillChoices?: string[];
    classFeatureChoices?: Record<string, unknown>;
    equipmentChoices?: Record<string, string>;
    creationComplete?: boolean;
}
export interface ActiveChoiceRuleStatus {
    name: string;
    type: string;
    complete: boolean;
}
export interface BackgroundSpellSelectionStatus {
    name: string;
    selectedCantrips: number;
    requiredCantrips: number;
    selectedLevel1: number;
    requiredLevel1Spells: number;
}
export interface SpellChoiceStatus {
    selectedCantrips: number;
    requiredCantrips: number;
    selectedLeveled: number;
    requiredLeveled: number;
}
export interface CreationFlowState {
    character: CreationFlowCharacter;
    levelUpMode: boolean;
    creationChoicesLocked: boolean;
    pointBuyBudget: number;
    pointBuySpent: number;
    subraceRequired: boolean;
    backgroundStepMissing: string[];
    classSkillSelectedCount: number;
    classSkillRequiredCount: number;
    activeChoiceRules: ActiveChoiceRuleStatus[];
    backgroundSpellSelections: BackgroundSpellSelectionStatus[];
    equipmentChoiceNames: string[];
    missingLevelUpChoices: string[];
    spellChoiceStatus: SpellChoiceStatus | null;
}
export interface StepValidationResult {
    valid: boolean;
    missing: string[];
    message: string;
}
export declare function validateCreationStep(step: BuilderStepId, state: CreationFlowState): StepValidationResult;
export declare function getMissingChoicesForStep(step: BuilderStepId, state: CreationFlowState): string[];
export declare function getMissingCreationChoices(state: CreationFlowState): string[];
export declare function getMissingSpellChoices(state: CreationFlowState): string[];
export {};
//# sourceMappingURL=creation-flow.d.ts.map