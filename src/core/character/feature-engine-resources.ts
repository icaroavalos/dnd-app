import type { Character, ApiState } from '../../types/state.js';
import {
  RESOURCE_META,
  resourceRecoveryFromBody,
  resourceActionKindFromBody,
  resourceMaxFromBody,
} from './resource-engine.js';
import type { ResourceDefinition } from './feature-engine-types.js';

export function deriveFeatureResource(
  feature: any,
  body: string,
  api: ApiState,
  character: Character
): ResourceDefinition | undefined {
  const meta = RESOURCE_META.find((entry) => entry.match.test(feature.name));
  const recovery = resourceRecoveryFromBody(body);
  const actionKind = resourceActionKindFromBody(body);
  const max = resourceMaxFromBody(body, api, character, Number(feature.level), meta);

  if ((max <= 0 || !Number.isFinite(max)) && Object.keys(recovery).length === 0) return undefined;

  return {
    id: meta?.id ?? slugify(feature.name),
    name: meta?.name ?? feature.name,
    className: api.classes[character.class]?.name ?? character.class,
    body,
    level: Number(feature.level) || 1,
    max,
    recovery,
    actionKind,
    isCanonical: meta?.isCanonical,
  };
}

export function deriveTraitResource(
  traitName: string,
  body: string,
  sourceLabel: string,
  api: ApiState,
  character: Character
): ResourceDefinition | undefined {
  const meta = RESOURCE_META.find((entry) => entry.match.test(traitName));
  const recovery = resourceRecoveryFromBody(body);
  const actionKind = resourceActionKindFromBody(body);
  const max = resourceMaxFromBody(body, api, character, 1, meta);

  if ((max <= 0 || !Number.isFinite(max)) && Object.keys(recovery).length === 0) return undefined;

  return {
    id: meta?.id ?? slugify(traitName),
    name: meta?.name ?? traitName,
    kind: 'species',
    sourceLabel,
    body,
    level: 1,
    max,
    recovery,
    actionKind,
    isCanonical: meta?.isCanonical,
  };
}

function slugify(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
