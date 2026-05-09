import type { AbilityName, AbilityIncrementPattern, BackgroundChoiceState, RawBackground } from '../../types/background.js';
export declare const SUPPORTED_GUIDED_BACKGROUNDS: readonly string[];
interface GuidedBackgroundSource {
    backgroundOptions?: [string, string][];
    backgroundDetails?: Record<string, RawBackground>;
}
export interface GuidedBackgroundOption {
    value: string;
    label: string;
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
    currentBackground: string | null;
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
    magicInitiateClass: string | null;
    spellcastingAbility: AbilityName | null;
}
export declare function createGuidedBackgroundChoiceState(background: string): BackgroundChoiceState;
export declare function ensureGuidedBackgroundChoiceState(bgChoices: BackgroundChoiceState | null | undefined, backgroundFallback?: string | null, source?: GuidedBackgroundSource | null): BackgroundChoiceState;
export declare function buildGuidedBackgroundViewModel(bgChoices?: BackgroundChoiceState | null, source?: GuidedBackgroundSource | null): GuidedBackgroundViewModel;
export declare function applyGuidedBackgroundIncrement(bgChoices: BackgroundChoiceState, increment: AbilityIncrementPattern): BackgroundChoiceState;
export declare function toggleGuidedBackgroundAbility(bgChoices: BackgroundChoiceState, ability: AbilityName, checked: boolean): BackgroundChoiceState;
export declare function applyGuidedBackgroundEquipmentChoice(bgChoices: BackgroundChoiceState | null | undefined, equipmentChoice: 'A' | 'B'): BackgroundChoiceState;
export declare function applyGuidedBackgroundSpellcastingAbility(bgChoices: BackgroundChoiceState | null | undefined, spellcastingAbility: AbilityName): BackgroundChoiceState;
export declare function normalizeGuidedBackground(background: string | null | undefined, source?: GuidedBackgroundSource | null): string | null;
export {};
//# sourceMappingURL=guided-background-builder.d.ts.map