import type { DerivedAction, DerivedCharacterSheet } from '@shared/contracts';
import { slugify, signed, titleize } from './utils.js';

interface SpellCatalogEntry {
  name: string;
  level?: number;
  entries?: string[];
  time?: Array<{ number?: number; unit?: string }>;
  range?: {
    distance?: {
      type?: string;
      amount?: number;
    };
    type?: string;
  };
  components?: Record<string, unknown>;
}

export function deriveClassSpellActions(
  character: any,
  projection: DerivedCharacterSheet,
  spellLookup: Map<string, SpellCatalogEntry>,
  classSpellNames: Set<string>
): DerivedAction[] {
  const actions: DerivedAction[] = [];

  for (const spellEntry of character.spells ?? []) {
    const spellName = typeof spellEntry === 'string' ? spellEntry : spellEntry?.name;
    const isClassSpell = classSpellNames.has(slugify(spellName));
    const isGrantedSpell = typeof spellEntry === 'object' && spellEntry?.originKind && spellEntry.originKind !== 'class';
    if (!isClassSpell && !isGrantedSpell) continue;
    const detail = spellLookup.get(slugify(spellName));
    if (!detail) continue;

    const level = Number(detail.level) || 0;
    const action = createSpellAction(detail, projection, {
      castMode: spellEntry?.resource?.id ? 'resource' : level > 0 && isClassSpell ? 'slots' : 'at-will',
      resourceId: spellEntry?.resource?.id,
      spellcastingAbility: spellEntry?.spellcastingAbility
    });

    if (action) actions.push(action);
  }

  return dedupeActions(actions);
}

export function deriveSpellActions(
  character: any,
  projection: DerivedCharacterSheet,
  spellLookup: Map<string, SpellCatalogEntry>
): DerivedAction[] {
  const actions: DerivedAction[] = [];

  for (const choice of character.spellChoices ?? []) {
    for (const cantripName of choice.selectedCantrips ?? []) {
      const detail = spellLookup.get(slugify(cantripName));
      if (!detail) continue;
      const action = createSpellAction(detail, projection, {
        castMode: 'at-will',
        spellcastingAbility: choice.spellcastingAbility
      });
      if (action) actions.push(action);
    }

    for (const spellName of choice.selectedLevel1Spells ?? []) {
      const detail = spellLookup.get(slugify(spellName));
      if (!detail) continue;
      const action = createSpellAction(detail, projection, {
        castMode: 'resource',
        resourceId: `bgSpell:${slugify(spellName)}`,
        spellcastingAbility: choice.spellcastingAbility
      });
      if (action) actions.push(action);
    }
  }

  return dedupeActions(actions);
}

export function createSpellAction(
  detail: SpellCatalogEntry,
  projection: DerivedCharacterSheet,
  options: { castMode: 'at-will' | 'resource' | 'slots'; resourceId?: string; spellcastingAbility?: 'int' | 'wis' | 'cha' }
): DerivedAction | null {
  const level = Number(detail.level) || 0;
  const description = entriesToText(detail.entries ?? []);
  const kind = actionKindForSpell(detail, description);

  if (!spellActionVisible(level, kind, description, projection)) {
    return null;
  }

  return {
    id: `spell-action:${slugify(detail.name)}`,
    kind,
    icon: 'SPL',
    name: detail.name,
    subtitle: level === 0 ? 'Cantrip' : `Spell Level ${level}`,
    range: compactRange(detail.range),
    rangeLabel: rangeLabel(detail.range),
    hit: spellHitOrDc(description, projection, options.spellcastingAbility),
    damage: spellDamageChips(description),
    notes: componentsLabel(detail.components),
    detail: clean5etoolsText(description),
    resource: options.castMode === 'resource' ? options.resourceId : undefined,
    slotLevel: options.castMode === 'slots' && level > 0 ? level : null,
    source: { type: 'spell', spellName: detail.name },
    cost: options.castMode === 'resource'
      ? { resource: options.resourceId, economy: kind }
      : options.castMode === 'slots' && level > 0
        ? { resource: 'spell_slot', slotLevel: level, economy: kind }
        : { economy: kind }
  };
}

export function actionKindForSpell(detail: SpellCatalogEntry, description: string): DerivedAction['kind'] {
  const castingTime = detail.time?.[0]?.unit?.toLowerCase() ?? '';
  const lowerDescription = description.toLowerCase();

  if (castingTime.includes('bonus')) return 'bonus';
  if (castingTime.includes('reaction')) return 'reaction';
  if (
    /(?:must|has to|succeed on|make(?:s)? a)\b[\s\S]{0,80}\bsaving throw/i.test(description) ||
    lowerDescription.includes('spell attack') ||
    /\btake(?:s)?\b[\s\S]{0,80}\bdamage\b/i.test(description)
  ) {
    return 'attack';
  }
  return castingTime.includes('action') ? 'action' : 'other';
}

export function spellActionVisible(
  level: number,
  kind: DerivedAction['kind'],
  description: string,
  projection: DerivedCharacterSheet
): boolean {
  if (kind === 'bonus' || kind === 'reaction') return true;
  const damage = spellDamageChips(description);
  const hit = spellHitOrDc(description, projection);
  if (kind === 'attack') return damage.length > 0 || hit !== '--';
  return level > 0 || (level === 0 && kind === 'action');
}

export function spellHitOrDc(
  description: string,
  projection: DerivedCharacterSheet,
  spellcastingAbility?: 'int' | 'wis' | 'cha'
): string {
  const metrics = resolveSpellcastingMetrics(projection, spellcastingAbility);
  const text = String(description).toLowerCase();
  if (/(?:must|has to|succeed on|make(?:s)? a)\b[\s\S]{0,80}\bsaving throw/i.test(description)) {
    return String(metrics?.saveDc ?? '--');
  }
  if (text.includes('spell attack')) return signed(metrics?.attackBonus ?? 0);
  return '--';
}

export function spellDamageChips(description = ''): string[] {
  if (!/\btake(?:s)?\b[\s\S]{0,80}\bdamage\b/i.test(description)) {
    return [];
  }
  const matches = [...String(description).matchAll(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi)].map((match) =>
    match[0].replace(/\s+/g, '')
  );
  return [...new Set(matches)].slice(0, 2);
}

function resolveSpellcastingMetrics(
  projection: DerivedCharacterSheet,
  spellcastingAbility?: 'int' | 'wis' | 'cha'
): { attackBonus: number; saveDc: number } | null | undefined {
  const byAbility = (projection as any).spellcastingByAbility?.[spellcastingAbility ?? ''];
  if (byAbility) return byAbility;

  if (spellcastingAbility && projection.abilityModifiers && projection.proficiencyBonus) {
    const modifier = Number(projection.abilityModifiers[spellcastingAbility]) || 0;
    return {
      attackBonus: projection.proficiencyBonus + modifier,
      saveDc: 8 + projection.proficiencyBonus + modifier,
    };
  }

  return projection.spellcasting;
}

export function createSpellLookup(entries: SpellCatalogEntry[]): Map<string, SpellCatalogEntry> {
  return new Map(entries.map((entry) => [slugify(entry.name), entry]));
}

export function compactRange(range: SpellCatalogEntry['range']): string {
  if (!range?.distance) return '--';
  if (range.distance.type === 'touch') return 'Touch';
  if (range.distance.type === 'self') return 'Self';
  if (range.distance.type === 'feet' && range.distance.amount) return `${range.distance.amount} feet`;
  return titleize(range.distance.type ?? range.type ?? '--');
}

export function rangeLabel(range: SpellCatalogEntry['range']): string {
  const compact = compactRange(range);
  return compact === 'Self' || compact === 'Touch' ? compact : 'Range';
}

export function componentsLabel(components: SpellCatalogEntry['components']): string {
  if (!components) return 'Magic';
  const labels = ['v', 's', 'm']
    .filter((key) => components[key])
    .map((key) => key.toUpperCase());
  return labels.length ? labels.join(', ') : 'Magic';
}

export function entriesToText(entries: unknown[]): string {
  return entries.map((entry) => entryToText(entry)).filter(Boolean).join('\n\n').trim();
}

function entryToText(entry: unknown): string {
  if (typeof entry === 'string') return clean5etoolsText(entry);
  if (!entry || typeof entry !== 'object') return '';
  const value = entry as any;
  const title = value.name ? `${value.name}. ` : '';
  if (Array.isArray(value.entries)) return title + entriesToText(value.entries);
  if (Array.isArray(value.items)) return title + entriesToText(value.items);
  if (value.entry) return title + entryToText(value.entry);
  return '';
}

export function clean5etoolsText(value: string): string {
  return String(value ?? '')
    .replace(/\{@(?:spell|item|condition|skill|sense|variantrule|filter|hazard|scaledamage|damage|feat|action|book)\s+([^|}]+)(?:\|[^}]*)?}/g, '$1')
    .replace(/\{@(?:dice|hit|d20|chance)\s+([^|}]+)(?:\|[^}]*)?}/g, '$1')
    .replace(/\{@i\s+([^}]+)}/g, '$1')
    .replace(/\{@b\s+([^}]+)}/g, '$1')
    .replace(/\{@[^}]+\}/g, '')
    .trim();
}

function dedupeActions<T extends { id: string }>(actions: T[]): T[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}
