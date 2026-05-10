import type { Character, ApiState } from '../../types/state.js';
import type { FeatureData, SubclassData } from '../../types/character.js';
import { deriveFeatureResource } from './feature-engine-resources.js';
import { resolveSubclassFeaturesForLevel } from './feature-engine-subclass.js';
import type { CharacterFeature } from './feature-engine-types.js';

export function mapClassFeature(
  feature: FeatureData,
  character: Character,
  api: ApiState,
  className: string,
  selectedSubclass: SubclassData | null
): CharacterFeature[] {
  const subclassFeatures = isSubclassPlaceholder(feature)
    ? resolveSubclassFeaturesForLevel(selectedSubclass, Number(feature.level), api)
    : [];
  const resolvedFeatures = subclassFeatures.length ? subclassFeatures : [feature];

  return resolvedFeatures.map((resolvedFeature) => {
    const resolvedName = resolvedFeature.name;
    const body = resolvedFeature.body || resolvedFeature.entries?.join('\n') || '';
    const resource = deriveFeatureResource(resolvedFeature, body, api, character);
    const meta = subclassFeatures.length
      ? `${selectedSubclass?.name} • ${resolvedFeature.source}`
      : `${className} ${feature.level} • ${feature.source}`;

    return {
      id: `class:${slugify(resolvedName)}:${feature.level}`,
      kind: 'class',
      name: resolvedName,
      meta,
      body,
      resource,
    };
  });
}

export function mapFeatToFeature(feat: FeatureData): CharacterFeature {
  const body = (feat as any).body || feat.entries?.join('\n') || '';
  return {
    id: `feat:${slugify(feat.name)}`,
    kind: 'feat',
    name: feat.name,
    meta: `Feat • ${feat.source}`,
    body,
  };
}

function isSubclassPlaceholder(feature: FeatureData): boolean {
  return /subclass/i.test(feature.name);
}

function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
