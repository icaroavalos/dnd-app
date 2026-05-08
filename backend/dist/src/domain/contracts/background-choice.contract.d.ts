import type { AbilityKey } from './base.contract.js';
export type BackgroundAbilityMode = 'plus2_plus1' | 'plus1_plus1_plus1';
export interface BackgroundChoiceState {
    backgroundId: string;
    abilityMode: BackgroundAbilityMode;
    abilityAssignments: Record<AbilityKey, number>;
    equipmentSelection: string[];
    featChoiceId?: string | null;
}
//# sourceMappingURL=background-choice.contract.d.ts.map