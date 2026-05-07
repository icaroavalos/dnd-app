/**
 * Character Projection - Deriva o estado completo para exibição (combate, perícias, etc)
 *
 * Esta é a única fonte de verdade para o que é exibido na ficha.
 */
import type { AbilityName } from '../../types/background.js';
import type { Character, DerivedCharacterSheet } from '../../types/state.js';
export interface ProjectionOptions {
    skills?: [string, AbilityName][];
    activeModifiers?: any[];
    spellAbility?: AbilityName;
    hitDie?: number;
    apiClasses?: Record<string, any>;
    apiLevels?: Record<string, any[]>;
}
/**
 * Deriva os dados da ficha baseados no estado bruto do personagem
 */
export declare function deriveCharacterSheet(character: Character, options?: ProjectionOptions): DerivedCharacterSheet;
//# sourceMappingURL=character-projection.d.ts.map