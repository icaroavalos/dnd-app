import type { AbilityName, AbilityIncrementPattern, BackgroundChoiceState } from '../../types/background.js';
export declare const SUPPORTED_GUIDED_BACKGROUNDS: readonly ["Acolyte", "Soldier"];
type SupportedGuidedBackground = typeof SUPPORTED_GUIDED_BACKGROUNDS[number];
export interface GuidedBackgroundOption {
    value: SupportedGuidedBackground;
    label: SupportedGuidedBackground;
    selected: boolean;
}
export interface GuidedAbilityOption {
    value: AbilityName;
    label: string;
    selected: boolean;
    disabled: boolean;
    bonus: number;
}
export interface GuidedBackgroundViewModel {
    currentBackground: SupportedGuidedBackground | null;
    options: GuidedBackgroundOption[];
    abilityOptions: GuidedAbilityOption[];
    skills: string[];
    tools: string[];
    equipmentOptions: {
        value: 'A' | 'B';
        label: string;
        hint: string;
        selected: boolean;
    }[];
    selectedAbilityCount: number;
    maxAbilityChoices: number;
    showsMagicInitiate: boolean;
    spellcastingAbility: AbilityName | null;
}
export declare function createGuidedBackgroundChoiceState(background: SupportedGuidedBackground): BackgroundChoiceState;
export declare function ensureGuidedBackgroundChoiceState(bgChoices: BackgroundChoiceState | null | undefined, backgroundFallback?: string | null): BackgroundChoiceState;
export declare function buildGuidedBackgroundViewModel(bgChoices?: BackgroundChoiceState | null): GuidedBackgroundViewModel;
export declare function applyGuidedBackgroundIncrement(bgChoices: BackgroundChoiceState, increment: AbilityIncrementPattern): BackgroundChoiceState;
export declare function toggleGuidedBackgroundAbility(bgChoices: BackgroundChoiceState, ability: AbilityName, checked: boolean): BackgroundChoiceState;
export declare function applyGuidedBackgroundEquipmentChoice(bgChoices: BackgroundChoiceState | null | undefined, equipmentChoice: 'A' | 'B'): BackgroundChoiceState;
export declare function applyGuidedBackgroundSpellcastingAbility(bgChoices: BackgroundChoiceState | null | undefined, spellcastingAbility: AbilityName): BackgroundChoiceState;
export declare function normalizeGuidedBackground(background: string | null | undefined): SupportedGuidedBackground | null;
export {};
//# sourceMappingURL=guided-background-builder.d.ts.map