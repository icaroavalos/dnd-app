export type RuleType = 'feature' | 'spell' | 'condition' | 'item' | 'action';
export type ActivationType = 'passive' | 'action' | 'bonus' | 'reaction' | 'on_hit' | 'on_equip' | 'on_attune' | 'manual';

export interface RuleActivation {
  type: ActivationType;
  resource_cost?: string | null;
}

export interface RuleMetadata {
  version: string;
  tags: string[];
  source: string;
}

export interface RuleAtom {
  uuid: string;
  type: RuleType;
  name: string;
  source: string;
  metadata: RuleMetadata;
  activation: RuleActivation;
  constraints: Record<string, unknown>;
  effects: any[];
  depends_on: string[];
  raw?: any;
}

const RULE_TYPES = new Set<RuleType>(['feature', 'spell', 'condition', 'item', 'action']);
const ACTIVATION_TYPES = new Set<ActivationType>(['passive', 'action', 'bonus', 'reaction', 'on_hit', 'on_equip', 'on_attune', 'manual']);

export function validateRuleAtom(rule: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    return { valid: false, errors: ['Rule must be an object.'] };
  }

  if (!rule.uuid || typeof rule.uuid !== 'string') errors.push('uuid must be a non-empty string.');
  if (!rule.type || !RULE_TYPES.has(rule.type as RuleType)) errors.push(`type must be one of: ${[...RULE_TYPES].join(', ')}.`);
  if (!rule.metadata || typeof rule.metadata !== 'object') errors.push('metadata must be an object.');
  if (rule.metadata && typeof rule.metadata.version !== 'string') errors.push('metadata.version must be a string.');
  if (rule.metadata?.tags && !Array.isArray(rule.metadata.tags)) errors.push('metadata.tags must be an array when present.');

  if (rule.activation) {
    if (typeof rule.activation !== 'object') errors.push('activation must be an object.');
    else if (!ACTIVATION_TYPES.has(rule.activation.type as ActivationType)) errors.push(`activation.type must be one of: ${[...ACTIVATION_TYPES].join(', ')}.`);
  }

  if (rule.constraints && typeof rule.constraints !== 'object') errors.push('constraints must be an object when present.');
  if (rule.effects && !Array.isArray(rule.effects)) errors.push('effects must be an array when present.');
  if (rule.depends_on && !Array.isArray(rule.depends_on)) errors.push('depends_on must be an array when present.');

  return { valid: errors.length === 0, errors };
}

export function normalizeRuleAtom(input: any, type: RuleType, defaults: Partial<RuleAtom> = {}): RuleAtom {
  const source = input?.source ? String(input.source) : (defaults.source ?? 'local');
  const name = input?.name ? String(input.name) : (defaults.name ?? 'Unnamed Rule');
  const uuid = defaults.uuid ?? `${type}:${slugify(name)}:${source.toLowerCase()}`;

  return {
    uuid,
    type,
    name,
    source,
    metadata: {
      version: defaults.metadata?.version ?? '5.5e',
      tags: defaults.metadata?.tags ?? [],
      source,
    },
    activation: defaults.activation ?? { type: 'passive', resource_cost: null },
    constraints: defaults.constraints ?? {},
    effects: defaults.effects ?? [],
    depends_on: defaults.depends_on ?? [],
    raw: input,
  };
}

function slugify(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
