import type { Character, ApiState } from '../../types/state.js';
import type { CharacterFeature } from './feature-engine-types.js';
import { deriveClassFeatures } from './feature-engine-class.js';
import { deriveSpeciesTraits } from './feature-engine-species.js';
import { deriveFeatFeatures } from './feature-engine-feats.js';

export function deriveActiveFeatures(
  character: Character,
  api: ApiState,
  classChoiceRules: any[] = []
): CharacterFeature[] {
  return [
    ...deriveClassFeatures(character, api, classChoiceRules),
    ...deriveSpeciesTraits(character, api),
    ...deriveFeatFeatures(character, api)
  ];
}
