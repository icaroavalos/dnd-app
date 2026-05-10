import type { Character, ApiState } from '../../types/state.js';
import { deriveTraitResource } from './feature-engine-resources.js';
import type { CharacterFeature } from './feature-engine-types.js';

export function deriveSpeciesTraits(character: Character, api: ApiState): CharacterFeature[] {
  const race = api.races[character.race];
  if (!race) return [];

  // Handle both normalized format (with traits array) and legacy format
  const traits = race.traits || [];

  return traits.map((trait) => {
    const body = Array.isArray(trait.entries) ? trait.entries.join('\n') : String(trait.entries || '');
    const resource = deriveTraitResource(trait.name, body, `${race.name} • ${race.source ?? 'XPHB'}`, api, character);

    return {
      id: `species:${slugify(trait.name)}`,
      kind: 'species' as const,
      name: trait.name,
      meta: `${race.name} • ${race.source ?? 'XPHB'}`,
      body,
      resource,
    };
  });
}

function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
