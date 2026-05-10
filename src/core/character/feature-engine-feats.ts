import type { Character, ApiState } from '../../types/state.js';
import type { FeatureData } from '../../types/character.js';
import { mapFeatToFeature } from './feature-engine-mapping.js';
import type { CharacterFeature } from './feature-engine-types.js';

function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function deriveFeatFeatures(character: Character, api: ApiState): CharacterFeature[] {
  const features: CharacterFeature[] = [];
  const featDetails = api.source?.featDetails ?? {};

  Object.entries(character.asiChoices ?? {}).forEach(([ruleId, choice]: [string, any]) => {
    if (choice?.mode === 'feat' && choice.feat) {
      const feat = featDetails[choice.feat];
      if (feat) {
        features.push(mapFeatToFeature(feat));
      }
    }
  });

  Object.entries(character.classFeatureChoices ?? {}).forEach(([choiceId, featName]: [string, any]) => {
    if (choiceId.includes('feat') || choiceId.includes('magic-initiate')) {
      const feat = featDetails[featName] || featDetails[slugify(featName)];
      if (feat) {
        features.push(mapFeatToFeature(feat));
      }
    }
  });

  return features;
}
