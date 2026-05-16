type FeatureResource = {
  id?: string;
  remaining?: number;
  current?: number;
  max?: number;
  recovery?: 'full' | 'inc' | 'short_rest' | 'long_rest' | 'none';
  recoveryLabel?: string;
  recoveryAmount?: number;
};

export type CharacterResourceState = {
  current: number;
  max: number;
  recovery: 'short_rest' | 'long_rest' | 'none';
  recoveryAmount?: number;
};

export function deriveResourcesFromFeatures(features: any[] = []): Record<string, CharacterResourceState> {
  const resources: Record<string, CharacterResourceState> = {};

  for (const feature of features) {
    const resource = feature?.resource as FeatureResource | undefined;
    if (!resource) continue;

    const id = canonicalResourceId(feature, resource);
    const max = Math.max(0, Number(resource.max ?? resource.current ?? resource.remaining ?? 0));
    if (!id || max <= 0) continue;

    resources[id] = {
      current: Math.max(0, Math.min(max, Number(resource.current ?? resource.remaining ?? max))),
      max,
      recovery: normalizeRecovery(resource),
      ...(Number(resource.recoveryAmount) > 0 ? { recoveryAmount: Number(resource.recoveryAmount) } : {}),
    };
  }

  return resources;
}

export function canonicalResourceId(feature: any, resource: FeatureResource = {}): string {
  const name = String(feature?.name ?? '').toLowerCase();
  if (name.includes('second wind')) return 'second_wind';
  if (name.includes('adrenaline rush')) return 'adrenaline_rush';
  if (name.includes('action surge')) return 'action_surge';
  if (name.includes('relentless endurance')) return 'relentless_endurance';

  return slugResourceId(resource.id || feature?.id || feature?.name || '');
}

function normalizeRecovery(resource: FeatureResource): CharacterResourceState['recovery'] {
  const recovery = String(resource.recovery ?? '').toLowerCase();
  const label = String(resource.recoveryLabel ?? '').toLowerCase();

  if (recovery === 'short_rest' || label.includes('short')) return 'short_rest';
  if (recovery === 'long_rest' || recovery === 'full' || label.includes('long')) return 'long_rest';
  if (recovery === 'none') return 'none';
  return 'long_rest';
}

function slugResourceId(value: string): string {
  return String(value)
    .split('|')[0]
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
