import type { Character, ApiState } from '../../types/state.js';
import type { FeatureData, SubclassData } from '../../types/character.js';
import { resolveSelectedSubclass } from './feature-engine-subclass.js';
import { mapClassFeature } from './feature-engine-mapping.js';
import type { CharacterFeature } from './feature-engine-types.js';

export function deriveClassFeatures(
  character: Character,
  api: ApiState,
  classChoiceRules: any[]
): CharacterFeature[] {
  const className = api.classes[character.class]?.name ?? character.class;
  const selectedSubclass = resolveSelectedSubclass(character, api);

  const unselectedOptionNames = new Set(
    classChoiceRules
      .filter((rule) => Array.isArray(rule.options))
      .flatMap((rule) =>
        rule.options
          .filter((option: any) => character.classFeatureChoices?.[rule.id] !== option.value)
          .map((option: any) => option.label)
      )
  );

  return (api.source?.classFeatures ?? [])
    .filter(
      (f: FeatureData) => slugify(f.className) === character.class && Number(f.level) <= character.level
    )
    .filter((f: FeatureData) => !unselectedOptionNames.has(f.name))
    .flatMap((f: FeatureData) => mapClassFeature(f, character, api, className, selectedSubclass));
}

function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
