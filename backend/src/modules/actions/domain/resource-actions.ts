import type { DerivedAction } from '@shared/contracts';

interface ResourceActionMeta {
  id: string;
  name: string;
  subtitle: string;
  actionKind?: DerivedAction['kind'];
  detail: string;
  recoveryLabel: string;
}

const CANONICAL_RESOURCE_META: Record<string, Omit<ResourceActionMeta, 'recoveryLabel'>> = {
  second_wind: {
    id: 'second_wind',
    name: 'Second Wind',
    subtitle: 'Fighter Feature',
    actionKind: 'bonus',
    detail: 'You have a limited reserve of stamina that you can draw on to regain Hit Points.'
  },
  action_surge: {
    id: 'action_surge',
    name: 'Action Surge',
    subtitle: 'Fighter Feature',
    actionKind: 'other',
    detail: 'You can push yourself beyond your normal limits for a moment.'
  },
  adrenaline_rush: {
    id: 'adrenaline_rush',
    name: 'Adrenaline Rush',
    subtitle: 'Orc Trait',
    actionKind: 'bonus',
    detail: 'You can take the Dash action as a Bonus Action and gain Temporary Hit Points.'
  },
  relentless_endurance: {
    id: 'relentless_endurance',
    name: 'Relentless Endurance',
    subtitle: 'Orc Trait',
    actionKind: 'other',
    detail: 'When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead.'
  }
};

interface ResourceState {
  current: number;
  max: number;
  recovery: string;
}

export function deriveResourceActions(character: any): DerivedAction[] {
  const actions: DerivedAction[] = [];

  const resources = character.resources as Record<string, ResourceState> | undefined;
  if (!resources) return actions;

  for (const [resourceId, resourceState] of Object.entries(resources)) {
    const meta = resolveResourceMeta(resourceId);
    const remaining = Math.max(0, Number(resourceState.current) || 0);

    if (meta.actionKind) {
      actions.push({
        id: `feature:${resourceId}`,
        kind: meta.actionKind,
        icon: actionIconForKind(meta.actionKind),
        name: meta.name,
        subtitle: meta.subtitle,
        range: 'Self',
        rangeLabel: 'Resource',
        hit: '--',
        damage: [],
        notes: `${remaining}/${resourceState.max} uses`,
        detail: meta.detail,
        resource: resourceId,
        cost: { resource: resourceId, economy: meta.actionKind },
        source: { type: 'feature', resourceId }
      });
    }

    actions.push({
      id: `limited:${resourceId}`,
      kind: 'limited',
      icon: 'LU',
      name: `${meta.name} Uses`,
      subtitle: meta.recoveryLabel,
      range: 'Self',
      rangeLabel: 'Resource',
      hit: '--',
      damage: [],
      notes: `${remaining}/${resourceState.max} available`,
      detail: meta.detail,
      resource: resourceId,
      cost: { resource: resourceId },
      source: { type: 'resource', resourceId }
    });
  }

  return actions;
}

export function resolveResourceMeta(resourceId: string): ResourceActionMeta {
  const canonical = CANONICAL_RESOURCE_META[resourceId];
  const recoveryLabel = resourceRecoveryLabel(resourceId);

  if (canonical) {
    return {
      ...canonical,
      recoveryLabel
    };
  }

  const fallbackName = titleize(resourceId.replace(/^bgSpell:/, '').replace(/_\d+$/, ''));

  return {
    id: resourceId,
    name: fallbackName,
    subtitle: resourceId.startsWith('bgSpell:') ? 'Background Spell' : 'Limited Use Resource',
    detail: resourceId.startsWith('bgSpell:')
      ? `Cast ${fallbackName} once without using a class spell slot.`
      : `${fallbackName} is a limited-use resource.`,
    recoveryLabel
  };
}

export function resourceRecoveryLabel(resourceId: string): string {
  if (resourceId.startsWith('bgSpell:')) return 'Long Rest Resource';
  if (resourceId === 'second_wind') return 'Short Rest Resource';
  if (resourceId === 'adrenaline_rush') return 'Short Rest Resource';
  return 'Limited Use Resource';
}

export function actionIconForKind(kind: DerivedAction['kind']): string {
  return {
    action: 'A',
    bonus: 'BA',
    reaction: 'R',
    other: 'O',
    limited: 'LU',
    attack: 'ATK'
  }[kind];
}

function titleize(value: string): string {
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
