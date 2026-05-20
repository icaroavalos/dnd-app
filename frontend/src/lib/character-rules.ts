import type { Choice, Currency, Feature } from '../types/character';

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

const ZERO_CURRENCY: Currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

export function normalizeClassSavingThrows(classEntry: any): AbilityKey[] {
  return (classEntry?.proficiency || [])
    .map((value: unknown) => String(value).toLowerCase())
    .filter((value: string): value is AbilityKey =>
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(value)
    );
}

export function instantiateStartingEquipment(
  startingEquipment: any,
  option: string,
  itemCatalog: any[] = [],
  source: 'class' | 'background' = 'class',
  occupiedSlots: Record<string, string> = {}
): { inventory: any[]; currency: Currency; equippedItems: string[]; equippedSlots: Record<string, string> } {
  const data = startingEquipment?.defaultData?.[0] ?? startingEquipment?.[0] ?? {};
  const entries = data?.[option] ?? data?.[option.toLowerCase()] ?? [];
  const itemLookup = createItemLookup(itemCatalog);
  const currency = { ...ZERO_CURRENCY };
  const equippedSlots: Record<string, string> = { ...occupiedSlots };
  const equippedItems: string[] = [];
  const inventory: any[] = [];

  for (const entry of entries) {
    const itemRef = typeof entry === 'string' ? entry : entry?.item;

    if (itemRef) {
      const baseItemId = String(itemRef).split('|').slice(0, 2).join('|').toLowerCase();
      const catalogItem = itemLookup.get(normalizeItemKey(baseItemId));
      const instanceId = `${normalizeItemKey(baseItemId)}-${source}-${inventory.length}`;
      const status = defaultEquipmentStatus(catalogItem, equippedSlots);
      const item = {
        ...(catalogItem || {}),
        baseItemId,
        instanceId,
        quantity: Number(entry?.quantity || 1),
        status,
        source,
      };
      inventory.push(item);

      if (status !== 'backpack') {
        equippedSlots[status] = instanceId;
        equippedItems.push(instanceId);
      }
      continue;
    }

    if (entry?.value) {
      addCurrency(currency, Number(entry.value));
    }
  }

  const newSlots = Object.fromEntries(
    Object.entries(equippedSlots).filter(([slot, id]) => occupiedSlots[slot] !== id)
  );
  return { inventory, currency, equippedItems, equippedSlots: newSlots };
}

export function classCantripLimit(classEntry: any, level: number): number | null {
  return classTableValue(classEntry, level, 'cantrip');
}

export function classPreparedSpellLimit(classEntry: any, level: number): number | null {
  return classTableValue(classEntry, level, 'prepared');
}

export function classResourceLimit(classEntry: any, level: number, resourceLabel: string): number | null {
  return classTableValue(classEntry, level, resourceLabel.toLowerCase());
}

export function buildExclusiveFeatureChoices(features: Array<Feature & { entries?: any[] }>): Choice[] {
  return features.flatMap((feature) => {
    const description = String(feature.description || '');
    if (!/one of the following|one of these|of the following options/i.test(description)) return [];

    const refs = extractReferencedFeatureNames(feature.entries || []);
    if (refs.length === 0) return [];

    return [{
      id: `feature-choice-${feature.id}`,
      featureId: feature.id,
      name: feature.name,
      count: 1,
      options: refs,
      type: 'generic' as const,
    }];
  });
}

export function selectedFeatureNames(
  features: Array<Feature & { entries?: any[] }>,
  selections: Record<string, string[]>
): string[] {
  return filterSelectedFeatures(features, selections).map((feature) => feature.name);
}

export function filterSelectedFeatures<T extends Feature & { entries?: any[] }>(
  features: T[],
  selections: Record<string, string[]>
): T[] {
  const exclusiveChoices = buildExclusiveFeatureChoices(features);
  const exclusiveOptionNames = new Set(exclusiveChoices.flatMap((choice) => choice.options));
  const selectedOptionNames = new Set(
    exclusiveChoices.flatMap((choice) => selections[choice.id] || [])
  );

  return features.filter((feature) => {
    if (!exclusiveOptionNames.has(feature.name)) return true;
    return selectedOptionNames.has(feature.name);
  });
}

export function buildFeatureTextChoices(features: Feature[], featsCatalog: any[] = []): Choice[] {
  const choices: Choice[] = [];

  for (const feature of features) {
    const description = String(feature.description || '');
    const idBase = feature.id || slugify(feature.name);

    if (/gain proficiency in one skill of your choice/i.test(description)) {
      choices.push({
        id: `skill-choice-${idBase}`,
        featureId: feature.id,
        name: feature.name,
        count: 1,
        options: SKILLS,
        type: 'generic',
      });
    }

    if (/origin feat[^.]+of your choice/i.test(description)) {
      const originFeats = featsCatalog
        .filter((feat) => String(feat.category || '').toUpperCase() === 'O')
        .map((feat) => feat.name)
        .sort();
      choices.push({
        id: `origin-feat-choice-${idBase}`,
        featureId: feature.id,
        name: feature.name,
        count: 1,
        options: originFeats.length ? originFeats : ORIGIN_FEAT_FALLBACKS,
        type: 'feat',
      });
    }
  }

  return choices;
}

export function stableFeatureId(feature: Partial<Feature> & Record<string, any>, fallbackLevel?: number): string {
  if (feature.id) return String(feature.id);
  return slugify([
    feature.name,
    feature.className || feature.originName,
    feature.subclassShortName,
    feature.level || fallbackLevel,
    feature.source || feature.meta,
  ].filter(Boolean).join('|'));
}

export function filterLevelUpChoicesForSubclass<T extends Choice & { subclassShortName?: string }>(
  choices: T[],
  features: Array<Feature & { subclassShortName?: string }>,
  selectedSubclass: string | null
): T[] {
  const selectedSubclassName = selectedSubclass ? normalizeSubclassName(selectedSubclass) : null;

  return choices.filter((choice) => {
    if (choice.type === 'subclass') return true;
    if (choice.type === 'asi' || choice.type === 'feat') return false;

    const feat = features.find((feature) => feature.id === choice.featureId);
    const scopedSubclass = choice.subclassShortName || feat?.subclassShortName;
    if (!scopedSubclass) return true;
    if (!selectedSubclassName) return false;
    return normalizeSubclassName(scopedSubclass) === selectedSubclassName;
  });
}

export function slotsWithoutSourceItems(
  slots: Record<string, string> = {},
  inventory: Array<{ instanceId?: string; source?: string }> = [],
  source: 'class' | 'background'
): Record<string, string> {
  const sourceItemIds = new Set(
    inventory
      .filter((item) => item.source === source && item.instanceId)
      .map((item) => item.instanceId as string)
  );

  return Object.fromEntries(
    Object.entries(slots).filter(([, itemId]) => !sourceItemIds.has(itemId))
  );
}

export function addCurrencies(current: Currency = ZERO_CURRENCY, delta: Currency = ZERO_CURRENCY): Currency {
  return {
    cp: (current.cp || 0) + (delta.cp || 0),
    sp: (current.sp || 0) + (delta.sp || 0),
    ep: (current.ep || 0) + (delta.ep || 0),
    gp: (current.gp || 0) + (delta.gp || 0),
    pp: (current.pp || 0) + (delta.pp || 0),
  };
}

export function subtractCurrencies(current: Currency = ZERO_CURRENCY, delta: Currency = ZERO_CURRENCY): Currency {
  return {
    cp: Math.max(0, (current.cp || 0) - (delta.cp || 0)),
    sp: Math.max(0, (current.sp || 0) - (delta.sp || 0)),
    ep: Math.max(0, (current.ep || 0) - (delta.ep || 0)),
    gp: Math.max(0, (current.gp || 0) - (delta.gp || 0)),
    pp: Math.max(0, (current.pp || 0) - (delta.pp || 0)),
  };
}

export function spellPreparedState(input: {
  spell: any;
  level: number;
  characterClass: string;
  preparedSpells?: string[];
}): { isPrepared: boolean; canUsePreparedMarker: boolean } {
  const isWizard = String(input.characterClass || '').toLowerCase() === 'wizard';
  const isGrantedSpell = input.spell?.originKind === 'background'
    || input.spell?.source === 'bg-feat'
    || (input.spell?.originKind === 'feature' && input.spell?.resource);
  const spellId = input.spell?.id || input.spell?.name;
  const isPrepared = !isWizard
    || input.level === 0
    || isGrantedSpell
    || (input.preparedSpells || []).includes(spellId);

  return {
    isPrepared,
    canUsePreparedMarker: isWizard && input.level > 0 && isPrepared,
  };
}

export function addSkillSelections(existing: string[], choices: Record<string, string[]>): string[] {
  const next = new Set(existing);
  Object.entries(choices).forEach(([id, values]) => {
    if (id.startsWith('skill-choice-')) values.forEach((value) => next.add(value));
  });
  return [...next];
}

export function normalizeSubclassName(value: string): string {
  return String(value || '')
    .replace(/Path of the /i, '')
    .replace(/Circle of the /i, '')
    .replace(/College of /i, '')
    .replace(/Oath of /i, '')
    .replace(/Domain/i, '')
    .trim()
    .toLowerCase();
}

function classTableValue(classEntry: any, level: number, labelNeedle: string): number | null {
  const group = (classEntry?.classTableGroups || []).find((candidate: any) =>
    (candidate.colLabels || []).some((label: unknown) =>
      cleanLabel(String(label)).includes(labelNeedle.toLowerCase())
    )
  );
  if (!group) return null;

  const colIndex = (group.colLabels || []).findIndex((label: unknown) =>
    cleanLabel(String(label)).includes(labelNeedle.toLowerCase())
  );
  const row = group.rows?.[Math.max(0, level - 1)];
  const value = Array.isArray(row) ? row[colIndex] : null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || null;
  if (value && typeof value === 'object' && typeof value.value === 'number') return value.value;
  return null;
}

function createItemLookup(items: any[]): Map<string, any> {
  const lookup = new Map<string, any>();
  items.forEach((item) => {
    [item.id, item.name, item.name && `${item.name}|${item.source || 'xphb'}`].forEach((key) => {
      if (key) lookup.set(normalizeItemKey(String(key)), item);
    });
  });
  return lookup;
}

function defaultEquipmentStatus(item: any, equippedSlots: Record<string, string>): string {
  const type = String(item?.type || '').split('|')[0].toUpperCase();
  const name = String(item?.name || '').toLowerCase();

  if (['LA', 'MA', 'HA'].includes(type) && !equippedSlots.equipped_armor) return 'equipped_armor';
  if ((type === 'S' || name === 'shield') && !equippedSlots.equipped_shield) return 'equipped_shield';
  if (['M', 'R'].includes(type) && !equippedSlots.equipped_main_hand) return 'equipped_main_hand';
  return 'backpack';
}

function addCurrency(currency: Currency, copperValue: number): void {
  currency.gp += Math.floor(copperValue / 100);
  copperValue %= 100;
  currency.sp += Math.floor(copperValue / 10);
  currency.cp += copperValue % 10;
}

function extractReferencedFeatureNames(entries: any[]): string[] {
  const refs: string[] = [];
  const visit = (entry: any) => {
    if (!entry) return;
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    if (typeof entry === 'object') {
      const ref = entry.classFeature || entry.subclassFeature;
      if ((entry.type === 'refClassFeature' || entry.type === 'refSubclassFeature') && ref) {
        refs.push(String(ref).split('|')[0]);
      }
      Object.values(entry).forEach(visit);
    }
  };
  visit(entries);
  return [...new Set(refs)];
}

function cleanLabel(label: string): string {
  return label
    .replace(/\{@[^ ]+\s+([^|}]+)(?:\|[^}]*)?}/g, '$1')
    .toLowerCase();
}

function normalizeItemKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/'/g, '')
    .replace(/[^a-z0-9|]+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SKILLS = [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival',
];

const ORIGIN_FEAT_FALLBACKS = [
  'Alert',
  'Crafter',
  'Healer',
  'Lucky',
  'Magic Initiate; Cleric',
  'Magic Initiate; Druid',
  'Magic Initiate; Wizard',
  'Musician',
  'Savage Attacker',
  'Skilled',
  'Tavern Brawler',
  'Tough',
].sort();
