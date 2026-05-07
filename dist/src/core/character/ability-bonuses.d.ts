import type { AbilityName } from '../../types/background.js';
import type { Character } from '../../types/state.js';
export type AbilityBonusMap = Record<AbilityName, number>;
export declare function calculateBackgroundAbilityBonuses(bgChoices: Character['bgChoices']): AbilityBonusMap;
export declare function calculateAsiAbilityBonuses(asiChoices: Character['asiChoices'], omitRuleId?: string): AbilityBonusMap;
export declare function calculateCharacterAbilityBonuses(character: Pick<Character, 'asiChoices' | 'bgChoices'>, options?: {
    omitAsiRuleId?: string;
}): AbilityBonusMap;
//# sourceMappingURL=ability-bonuses.d.ts.map