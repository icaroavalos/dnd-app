/**
 * Feature Engine - Agrega todas as características (features) do personagem
 *
 * Filtra e formata features de classe, raça, background e feats baseados nas escolhas.
 */
import type { Character, ApiState } from '../../types/state.js';
import { type ResourceDefinition } from './resource-engine.js';
export interface CharacterFeature {
    id: string;
    kind: 'class' | 'species' | 'background' | 'feat';
    name: string;
    meta: string;
    body: string;
    resource?: ResourceDefinition;
}
/**
 * Retorna todas as características ativas do personagem
 */
export declare function deriveActiveFeatures(character: Character, api: ApiState, classChoiceRules?: any[]): CharacterFeature[];
//# sourceMappingURL=feature-engine.d.ts.map