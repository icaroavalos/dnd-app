/**
 * Feature Engine - Agrega todas as características (features) do personagem
 *
 * Filtra e formata features de classe, raça, background e feats baseados nas escolhas.
 */

import type { Character, ApiState } from '../../types/state.js';
import type { FeatureData } from '../../types/character.js';
import {
  RESOURCE_META,
  resourceRecoveryFromBody,
  resourceActionKindFromBody,
  resourceMaxFromBody,
  type ResourceDefinition
} from './resource-engine.js';

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

function deriveClassFeatures(
  character: Character,
  api: ApiState,
  classChoiceRules: any[]
): CharacterFeature[] {
  const className = api.classes[character.class]?.name ?? character.class;

  // Filtra opções de features não escolhidas
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
    .filter((f: FeatureData) => slugify(f.className) === character.class && Number(f.level) <= character.level)
    .filter((f: FeatureData) => !unselectedOptionNames.has(f.name))
    .map((f: FeatureData) => {
      const body = (f as any).body || f.entries?.join('\n') || '';
      const meta = RESOURCE_META.find(m => m.match.test(f.name));
      let resource: ResourceDefinition | undefined;

      if (meta) {
        const recovery = resourceRecoveryFromBody(body);
        const actionKind = resourceActionKindFromBody(body);
        const max = resourceMaxFromBody(body, api, character, Number(f.level), meta);

        if ((max > 0) || Object.keys(recovery).length > 0 || actionKind) {
          resource = {
            id: meta.id,
            name: meta.name,
            className: api.classes[character.class]?.name ?? character.class,
            body,
            level: Number(f.level) || 1,
            max,
            recovery,
            actionKind,
            isCanonical: meta.isCanonical
          };
        }
      }

      return {
        id: `class:${slugify(f.name)}:${f.level}`,
        kind: 'class' as const,
        name: f.name,
        meta: `${className} ${f.level} • ${f.source}`,
        body,
        resource
      };
    });
}

function deriveSpeciesTraits(character: Character, api: ApiState): CharacterFeature[] {
  const race = api.races[character.race];
  if (!race) return [];

  return (race.traits || []).map((trait) => {
    const body = trait.entries?.join('\n') || '';
    const meta = RESOURCE_META.find(m => m.match.test(trait.name));
    let resource: ResourceDefinition | undefined;

    if (meta) {
      const recovery = resourceRecoveryFromBody(body);
      const actionKind = resourceActionKindFromBody(body);
      const max = resourceMaxFromBody(body, api, character, 1, meta);

      if ((max > 0) || Object.keys(recovery).length > 0 || actionKind) {
        resource = {
          id: meta.id,
          name: meta.name,
          kind: 'species',
          sourceLabel: `${race.name} • ${race.source}`,
          body,
          level: 1,
          max,
          recovery,
          actionKind,
          isCanonical: meta.isCanonical
        };
      }
    }

    return {
      id: `species:${slugify(trait.name)}`,
      kind: 'species' as const,
      name: trait.name,
      meta: `${race.name} • ${race.source}`,
      body,
      resource
    };
  });
}

function deriveFeatFeatures(character: Character, api: ApiState): CharacterFeature[] {
  // A ser implementado quando o sistema de feats estiver no TS
  return [];
}

function slugify(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
