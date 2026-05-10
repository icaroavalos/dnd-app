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

  for (const spellName of character.spells ?? []) {
    if (!classSpellNames.has(slugify(spellName))) continue;
    const detail = spellLookup.get(slugify(spellName));
    if (!detail) continue;

    const level = Number(detail.level) || 0;
    const action = createSpellAction(detail, projection, {
      castMode: level > 0 ? 'slots' : 'at-will'
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

  for (const choice of character.spellChoices) {
    for (const cantripName of choice.selectedCantrips) {
      const detail = spellLookup.get(slugify(cantripName));
      if (!detail) continue;
      const action = createSpellAction(detail, projection, { castMode: 'at-will' });
      if (action) actions.push(action);
    }

    for (const spellName of choice.selectedLevel1Spells) {
      const detail = spellLookup.get(slugify(spellName));
      if (!detail) continue;
      const action = createSpellAction(detail, projection, {
        castMode: 'resource',
        resourceId: `bgSpell:${slugify(spellName)}`
      });
      if (action) actions.push(action);
    }
  }

  return dedupeActions(actions);
}

export function createSpellAction(
  detail: SpellCatalogEntry,
  projection: DerivedCharacterSheet,
  options: { castMode: 'at-will' | 'resource' | 'slots'; resourceId?: string }
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
    hit: spellHitOrDc(description, projection),
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
    lowerDescription.includes('saving throw') ||
    lowerDescription.includes('spell attack') ||
    lowerDescription.includes(' damage')
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

export function spellHitOrDc(description: string, projection: DerivedCharacterSheet): string {
  const text = String(description).toLowerCase();
  if (text.includes('saving throw')) return String(projection.spellcasting?.saveDc ?? '--');
  if (text.includes('spell attack')) return signed(projection.spellcasting?.attackBonus ?? 0);
  return '--';
}

export function spellDamageChips(description = ''): string[] {
  const matches = [...String(description).matchAll(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi)].map((match) =>
    match[0].replace(/\s+/g, '')
  );
  return [...new Set(matches)].slice(0, 2);
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

export function entriesToText(entries: string[]): string {
  return entries.map((entry) => clean5etoolsText(entry)).join('\n\n').trim();
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
