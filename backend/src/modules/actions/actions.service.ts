import { Inject, Injectable } from '@nestjs/common';

import type {
  CharacterAttack,
  CharacterRecord,
  DerivedAction,
  DerivedActionKind,
  DerivedCharacterSheet
} from '@shared/contracts';
import type { RulesCatalogEntry } from '../rules/contracts/rules-catalog-entry.js';
import {
  countAmmoInInventory,
  normalizeInventoryQuantity,
  resolveAmmoGroup
} from '../inventory/ammo-rules.js';
import { CharactersService } from '../characters/characters.service.js';
import { RulesService } from '../rules/rules.service.js';

interface SpellCatalogEntry extends RulesCatalogEntry {
  time?: Array<{ number?: number; unit?: string }>;
  range?: {
    type?: string;
    distance?: {
      type?: string;
      amount?: number;
    };
  };
  components?: Record<string, unknown>;
  entries?: string[];
}

interface ItemCatalogEntry extends RulesCatalogEntry {
  type?: string;
  dmg1?: string;
  dmgType?: string;
  range?: string;
  property?: string[];
}

interface ClassSpellListEntry extends RulesCatalogEntry {
  className?: string;
  classSource?: string;
  spells?: Array<{ name: string; source: string }>;
}

interface ResourceActionMeta {
  id: string;
  name: string;
  subtitle: string;
  actionKind?: DerivedActionKind;
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
  }
};

@Injectable()
export class ActionsService {
  constructor(
    @Inject(RulesService)
    private readonly rulesService: RulesService,
    @Inject(CharactersService)
    private readonly charactersService: CharactersService
  ) {}

  async deriveActions(character: CharacterRecord): Promise<DerivedAction[]> {
    const [projection, spellsCatalog, classSpellsCatalog, itemsCatalog] = await Promise.all([
      this.charactersService.projectCharacter(character),
      this.rulesService.getCatalog('spells'),
      this.rulesService.getCatalog('class-spells'),
      this.rulesService.getCatalog('items')
    ]);

    const spellDetails = createSpellLookup(spellsCatalog.results as SpellCatalogEntry[]);
    const itemDetails = createItemLookup(itemsCatalog.results as ItemCatalogEntry[]);
    const classSpellNames = resolveClassSpellNames(character, classSpellsCatalog.results as ClassSpellListEntry[]);

    return [
      ...deriveAttackActions(character, projection, itemDetails),
      ...deriveClassSpellActions(character, projection, spellDetails, classSpellNames),
      ...deriveSpellActions(character, projection, spellDetails),
      ...deriveBasicActions(character, itemDetails),
      ...deriveResourceActions(character)
    ].map((action) => ({
      ...action,
      disabled: isActionDisabled(action, character, projection)
    }));
  }
}

function deriveBasicActions(
  character: CharacterRecord,
  itemLookup: Map<string, ItemCatalogEntry>
): DerivedAction[] {
  const opportunityReach = resolveOpportunityReach(character, itemLookup);
  const canUseTwoWeaponFighting = hasTwoWeaponFightingLoadout(character, itemLookup);

  return [
    {
      id: 'rule:attack',
      kind: 'action',
      icon: 'A',
      name: 'Attack',
      subtitle: 'Combat Action',
      range: '--',
      rangeLabel: 'Varies',
      hit: '--',
      damage: [],
      notes: 'Make one attack with a weapon or an Unarmed Strike.',
      detail: 'When you take the Attack action, you can make one attack roll with a weapon or an Unarmed Strike.',
      cost: { economy: 'action' }
    },
    {
      id: 'rule:dash',
      kind: 'action',
      icon: 'A',
      name: 'Dash',
      subtitle: 'Combat Action',
      range: 'Self',
      rangeLabel: 'Move',
      hit: '--',
      damage: [],
      notes: 'Gain extra movement for the current turn.',
      detail: 'When you take the Dash action, you gain extra movement for the current turn.',
      cost: { economy: 'action' }
    },
    {
      id: 'rule:dodge',
      kind: 'action',
      icon: 'A',
      name: 'Dodge',
      subtitle: 'Combat Action',
      range: 'Self',
      rangeLabel: 'Defense',
      hit: '--',
      damage: [],
      notes: 'Attacks against you have Disadvantage.',
      detail: 'Until the start of your next turn, attack rolls against you have Disadvantage if you can see the attacker.',
      cost: { economy: 'action' }
    },
    {
      id: 'rule:two-weapon',
      kind: 'bonus',
      icon: 'BA',
      name: 'Two-Weapon Fighting',
      subtitle: 'Bonus Action',
      range: 'Melee',
      rangeLabel: 'Weapon',
      hit: '--',
      damage: [],
      notes: canUseTwoWeaponFighting
        ? 'Extra attack with eligible Light weapons.'
        : 'Requires two equipped Light weapons.',
      detail: canUseTwoWeaponFighting
        ? "When you make the extra attack of the Light property, you don't add your ability modifier to the extra attack's damage unless that modifier is negative."
        : 'Equip two equipped Light weapons in your main hand and off hand to make the Light-property extra attack as a Bonus Action.',
      cost: { economy: 'bonus' },
      source: { type: 'rule', requiresLightWeapons: true, lightWeaponsReady: canUseTwoWeaponFighting }
    },
    {
      id: 'rule:opportunity',
      kind: 'reaction',
      icon: 'R',
      name: 'Opportunity Attack',
      subtitle: 'Reaction',
      range: `${opportunityReach} feet`,
      rangeLabel: 'Melee',
      hit: '--',
      damage: [],
      notes: `A creature leaves your reach (${opportunityReach} feet).`,
      detail: `You can make an Opportunity Attack when a creature you can see leaves your reach of ${opportunityReach} feet.`,
      cost: { economy: 'reaction' }
    },
    {
      id: 'rule:interact',
      kind: 'other',
      icon: 'O',
      name: 'Interact with an Object',
      subtitle: 'Other',
      range: 'Touch',
      rangeLabel: 'Object',
      hit: '--',
      damage: [],
      notes: 'Interact with one object or feature.',
      detail: 'You normally interact with one object or feature of the environment for free during your move or action.',
      cost: { economy: 'free' }
    }
  ];
}

function deriveAttackActions(
  character: CharacterRecord,
  projection: DerivedCharacterSheet,
  itemLookup: Map<string, ItemCatalogEntry>
): DerivedAction[] {
  const explicitActions = (character.attacks ?? []).map((attack: CharacterAttack, index) =>
    createExplicitAttackAction(attack, index, character, projection)
  );
  const explicitItemIds = new Set(
    (character.attacks ?? [])
      .map((attack) => attack.itemId ?? null)
      .filter((itemId): itemId is string => Boolean(itemId))
  );

  const derivedFromInventory = deriveInventoryAttackActions(character, projection, itemLookup).filter((action) => {
    const itemId = typeof action.source?.itemId === 'string' ? action.source.itemId : null;
    return !itemId || !explicitItemIds.has(itemId);
  });

  return [...explicitActions, ...derivedFromInventory];
}

function createExplicitAttackAction(
  attack: CharacterAttack,
  index: number,
  character: CharacterRecord,
  projection: DerivedCharacterSheet
): DerivedAction {
  const attackAbility = resolveAttackAbilityForExplicitAttack(attack, character);
  const abilityMod = projection.abilityModifiers[attackAbility] ?? 0;
  const hitBonus = projection.proficiencyBonus + abilityMod;

  return {
    id: `attack:${index}:${slugify(attack.name)}`,
    kind: 'attack',
    icon: 'ATK',
    name: attack.name,
    subtitle: 'Weapon / Attack',
    range: attack.range,
    rangeLabel: attack.range === '5 feet' ? 'Melee' : 'Ranged',
    hit: signed(hitBonus),
    damage: [`${attack.damage}${signed(abilityMod)}`],
    notes: attack.type,
    detail: attack.type,
    source: { type: 'attack', itemId: attack.itemId ?? null },
    cost: { economy: 'action' }
  };
}

function deriveInventoryAttackActions(
  character: CharacterRecord,
  projection: DerivedCharacterSheet,
  itemLookup: Map<string, ItemCatalogEntry>
): DerivedAction[] {
  const actions: DerivedAction[] = [];

  for (const item of character.inventory) {
    if (item.status !== 'equipped_main_hand' && item.status !== 'equipped_off_hand') {
      continue;
    }

    const detail = itemLookup.get(slugify(item.baseItemId));
    if (!detail || !isWeapon(detail)) {
      continue;
    }

    const properties = weaponPropertySet(detail);
    const hasLoading = properties.has('LD');
    const hasReload = properties.has('RLD');
    const attackAbility = resolveAttackAbilityForItem(detail, projection);
    const abilityMod = projection.abilityModifiers[attackAbility] ?? 0;
    const hitBonus = projection.proficiencyBonus + abilityMod;
    const weaponDamage = resolveInventoryWeaponDamage(item.instanceId, detail, character.inventory);
    const ammoState = resolveAmmoState(detail, character.inventory);
    const twoHandedBlocked = isTwoHandedWeaponBlocked(item.instanceId, detail, character.inventory);
    const freeHandToLoadAvailable = hasFreeHandToLoad(item.instanceId, detail, character.inventory);
    const loadingBlocked = requiresFreeHandToLoad(detail) && !freeHandToLoadAvailable;
    const detailText = buildWeaponDetail(detail, ammoState, {
      twoHandedBlocked,
      loadingBlocked
    });

    actions.push(
      createInventoryAttackAction({
        instanceId: item.instanceId,
        baseItemId: item.baseItemId,
        item: detail,
        hitBonus,
        abilityMod,
        weaponDamage,
        ammoState,
        detailText,
        twoHandedBlocked,
        loadingBlocked,
        loading: hasLoading,
        reload: hasReload
      })
    );

    if (canMakeThrownAttack(detail)) {
      actions.push(
        createInventoryAttackAction({
          instanceId: item.instanceId,
          baseItemId: item.baseItemId,
          item: detail,
          hitBonus,
          abilityMod,
          weaponDamage,
          ammoState,
          detailText,
          twoHandedBlocked,
          loadingBlocked,
          variant: 'thrown'
        })
      );
    }
  }

  return actions;
}

function createInventoryAttackAction(input: {
  instanceId: string;
  baseItemId: string;
  item: ItemCatalogEntry;
  hitBonus: number;
  abilityMod: number;
  weaponDamage: string;
  ammoState: { required: boolean; count: number };
  detailText: string;
  twoHandedBlocked: boolean;
  loadingBlocked: boolean;
  loading?: boolean;
  reload?: boolean;
  variant?: 'thrown';
}): DerivedAction {
  const isThrownVariant = input.variant === 'thrown';

  return {
    id: isThrownVariant ? `attack:${input.instanceId}:thrown` : `attack:${input.instanceId}`,
    kind: 'attack',
    icon: 'ATK',
    name: input.item.name,
    subtitle: isThrownVariant ? 'Weapon / Thrown Attack' : 'Weapon / Attack',
    range: isThrownVariant ? normalizeThrownRange(input.item) : normalizeWeaponRange(input.item),
    rangeLabel: isThrownVariant ? 'Thrown' : weaponRangeLabel(input.item),
    hit: signed(input.hitBonus),
    damage: [`${input.weaponDamage}${signed(input.abilityMod)}`],
    notes: weaponNotes(input.item, input.ammoState),
    detail: input.detailText,
    source: {
      type: 'attack',
      itemId: input.instanceId,
      baseItemId: input.baseItemId,
      ammoRequired: input.ammoState.required,
      ammoCount: input.ammoState.count,
      twoHandedBlocked: input.twoHandedBlocked,
      loadingBlocked: input.loadingBlocked,
      thrownVariant: isThrownVariant,
      loading: input.loading,
      reload: input.reload
    },
    cost: { economy: 'action' }
  };
}

function deriveClassSpellActions(
  character: CharacterRecord,
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

function deriveSpellActions(
  character: CharacterRecord,
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

function createSpellAction(
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

function deriveResourceActions(character: CharacterRecord): DerivedAction[] {
  const actions: DerivedAction[] = [];

  for (const [resourceId, resourceState] of Object.entries(character.resources)) {
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

function resolveResourceMeta(resourceId: string): ResourceActionMeta {
  const canonical = CANONICAL_RESOURCE_META[resourceId];
  const recoveryLabel = resourceRecoveryLabel(resourceId);

  if (canonical) {
    return {
      ...canonical,
      recoveryLabel
    };
  }

  const fallbackName = titleize(resourceId.replace(/^bgSpell:/, ''));

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

function actionKindForSpell(detail: SpellCatalogEntry, description: string): DerivedActionKind {
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

function spellActionVisible(
  level: number,
  kind: DerivedActionKind,
  description: string,
  projection: DerivedCharacterSheet
): boolean {
  if (kind === 'bonus' || kind === 'reaction') return true;
  const damage = spellDamageChips(description);
  const hit = spellHitOrDc(description, projection);
  if (kind === 'attack') return damage.length > 0 || hit !== '--';
  return level > 0 || (level === 0 && kind === 'action');
}

function spellHitOrDc(description: string, projection: DerivedCharacterSheet): string {
  const text = String(description).toLowerCase();
  if (text.includes('saving throw')) return String(projection.spellcasting?.saveDc ?? '--');
  if (text.includes('spell attack')) return signed(projection.spellcasting?.attackBonus ?? 0);
  return '--';
}

function spellDamageChips(description = ''): string[] {
  const matches = [...String(description).matchAll(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi)].map((match) =>
    match[0].replace(/\s+/g, '')
  );
  return [...new Set(matches)].slice(0, 2);
}

function createSpellLookup(entries: SpellCatalogEntry[]): Map<string, SpellCatalogEntry> {
  return new Map(entries.map((entry) => [slugify(entry.name), entry]));
}

function createItemLookup(entries: ItemCatalogEntry[]): Map<string, ItemCatalogEntry> {
  return new Map(entries.map((entry) => [slugify(entry.name), entry]));
}

function compactRange(range: SpellCatalogEntry['range']): string {
  if (!range?.distance) return '--';
  if (range.distance.type === 'touch') return 'Touch';
  if (range.distance.type === 'self') return 'Self';
  if (range.distance.type === 'feet' && range.distance.amount) return `${range.distance.amount} feet`;
  return titleize(range.distance.type ?? range.type ?? '--');
}

function rangeLabel(range: SpellCatalogEntry['range']): string {
  const compact = compactRange(range);
  return compact === 'Self' || compact === 'Touch' ? compact : 'Range';
}

function componentsLabel(components: SpellCatalogEntry['components']): string {
  if (!components) return 'Magic';
  const labels = ['v', 's', 'm']
    .filter((key) => components[key])
    .map((key) => key.toUpperCase());
  return labels.length ? labels.join(', ') : 'Magic';
}

function entriesToText(entries: string[]): string {
  return entries.map((entry) => clean5etoolsText(entry)).join('\n\n').trim();
}

function clean5etoolsText(value: string): string {
  return String(value ?? '')
    .replace(/\{@(?:spell|item|condition|skill|sense|variantrule|filter|hazard|scaledamage|damage|feat|action|book)\s+([^|}]+)(?:\|[^}]*)?}/g, '$1')
    .replace(/\{@(?:dice|hit|d20|chance)\s+([^|}]+)(?:\|[^}]*)?}/g, '$1')
    .replace(/\{@i\s+([^}]+)}/g, '$1')
    .replace(/\{@b\s+([^}]+)}/g, '$1')
    .replace(/\{@[^}]+\}/g, '')
    .trim();
}

function isActionDisabled(
  action: Pick<DerivedAction, 'resource' | 'slotLevel' | 'source'>,
  character: CharacterRecord,
  projection: DerivedCharacterSheet
): boolean {
  if (action.resource) {
    const resource = character.resources[action.resource];
    return !resource || Number(resource.current) <= 0;
  }

  if (action.slotLevel) {
    const used = Number(character.state.spellSlotsUsed[String(action.slotLevel)] ?? 0);
    const max = Number(projection.spellSlotsMax[String(action.slotLevel)] ?? 0);
    return max <= 0 || used >= max;
  }

  if (action.source?.ammoRequired) {
    if (Number(action.source.ammoCount ?? 0) <= 0) {
      return true;
    }
  }

  if (action.source?.requiresLightWeapons) {
    return !Boolean(action.source.lightWeaponsReady);
  }

  if (action.source?.twoHandedBlocked) {
    return true;
  }

  if (action.source?.loadingBlocked) {
    return true;
  }

  return false;
}

function resolveClassSpellNames(
  character: CharacterRecord,
  classSpellEntries: ClassSpellListEntry[]
): Set<string> {
  const primaryClass = slugify(character.classes[0]?.classId ?? '');
  const entry = classSpellEntries.find((candidate) => slugify(candidate.className ?? '') === primaryClass);
  return new Set((entry?.spells ?? []).map((spell) => slugify(spell.name)));
}

function resolveAttackAbilityForExplicitAttack(
  attack: CharacterAttack,
  character: CharacterRecord
): 'str' | 'dex' {
  if (String(attack.range ?? '').includes('/')) {
    return 'dex';
  }

  const classId = slugify(character.classes[0]?.classId ?? '');
  return classId === 'monk' || classId === 'rogue' ? 'dex' : 'str';
}

function resolveAttackAbilityForItem(
  item: ItemCatalogEntry,
  projection: DerivedCharacterSheet
): 'str' | 'dex' {
  const typeCode = String(item.type ?? '').split('|')[0];
  const propertyCodes = new Set((item.property ?? []).map((value) => String(value).split('|')[0]));

  if (typeCode === 'R') {
    return 'dex';
  }

  if (propertyCodes.has('F')) {
    return projection.abilityModifiers.dex > projection.abilityModifiers.str ? 'dex' : 'str';
  }

  return 'str';
}

function isWeapon(item: ItemCatalogEntry): boolean {
  const typeCode = String(item.type ?? '').split('|')[0];
  return Boolean(item.dmg1) && (typeCode === 'M' || typeCode === 'R');
}

function weaponPropertySet(item: ItemCatalogEntry): Set<string> {
  return new Set((item.property ?? []).map((value) => String(value).split('|')[0]));
}

function buildWeaponDetail(
  item: ItemCatalogEntry,
  ammoState: { required: boolean; count: number },
  blockers: { twoHandedBlocked: boolean; loadingBlocked: boolean }
): string {
  const parts = [weaponNotes(item, ammoState)];

  if (blockers.twoHandedBlocked) {
    parts.push('Blocked: this weapon requires two hands.');
  }

  if (blockers.loadingBlocked) {
    parts.push('Blocked: this weapon requires a free hand to load.');
  }

  return parts.filter(Boolean).join(' ');
}

function normalizeWeaponRange(item: ItemCatalogEntry): string {
  if (canMakeThrownAttack(item)) {
    return '5 feet';
  }
  return item.range ? String(item.range) : '5 feet';
}

function normalizeThrownRange(item: ItemCatalogEntry): string {
  return item.range ? String(item.range) : '20/60';
}

function resolveInventoryWeaponDamage(
  instanceId: string,
  item: ItemCatalogEntry,
  inventory: CharacterRecord['inventory']
): string {
  const properties = weaponPropertySet(item);

  if (!properties.has('V')) {
    return String(item.dmg1);
  }

  if (!canUseVersatileDamage(instanceId, inventory)) {
    return String(item.dmg1);
  }

  return versatileDamageForBase(String(item.dmg1));
}

function canUseVersatileDamage(
  instanceId: string,
  inventory: CharacterRecord['inventory']
): boolean {
  const currentItem = inventory.find((item) => item.instanceId === instanceId);
  if (!currentItem || currentItem.status !== 'equipped_main_hand') {
    return false;
  }

  return !inventory.some((item) => {
    if (item.instanceId === instanceId) return false;
    return item.status === 'equipped_off_hand' || item.status === 'equipped_shield';
  });
}

function isTwoHandedWeaponBlocked(
  instanceId: string,
  item: ItemCatalogEntry,
  inventory: CharacterRecord['inventory']
): boolean {
  if (!weaponPropertySet(item).has('2H')) {
    return false;
  }

  return inventory.some((candidate) => {
    if (candidate.instanceId === instanceId) return false;
    return candidate.status === 'equipped_off_hand' || candidate.status === 'equipped_shield';
  });
}

function requiresFreeHandToLoad(item: ItemCatalogEntry): boolean {
  const properties = weaponPropertySet(item);
  return properties.has('A') && !properties.has('2H');
}

function hasFreeHandToLoad(
  instanceId: string,
  item: ItemCatalogEntry,
  inventory: CharacterRecord['inventory']
): boolean {
  if (!requiresFreeHandToLoad(item)) {
    return true;
  }

  return !inventory.some((candidate) => {
    if (candidate.instanceId === instanceId) return false;
    return candidate.status === 'equipped_off_hand' || candidate.status === 'equipped_shield';
  });
}

function versatileDamageForBase(baseDamage: string): string {
  switch (baseDamage) {
    case '1d6':
      return '1d8';
    case '1d8':
      return '1d10';
    default:
      return baseDamage;
  }
}

function weaponRangeLabel(item: ItemCatalogEntry): string {
  const typeCode = String(item.type ?? '').split('|')[0];
  if (canMakeThrownAttack(item)) {
    return 'Melee';
  }
  return typeCode === 'R' || Boolean(item.range) ? 'Ranged' : 'Melee';
}

function weaponNotes(
  item: ItemCatalogEntry,
  ammoState?: { required: boolean; count: number }
): string {
  const parts = [
    normalizeDamageType(item.dmgType),
    normalizeWeaponProperties(item.property ?? []),
    ammoState?.required ? `Ammo: ${ammoState.count}` : ''
  ].filter(Boolean);
  return parts.join(' • ') || 'Weapon attack';
}

function resolveAmmoState(
  item: ItemCatalogEntry,
  inventory: CharacterRecord['inventory']
): { required: boolean; count: number } {
  const ammoGroup = resolveAmmoGroup(item);
  if (!ammoGroup) {
    return { required: false, count: 0 };
  }
  return { required: true, count: countAmmoInInventory(inventory, ammoGroup) };
}

function resolveOpportunityReach(
  character: CharacterRecord,
  itemLookup: Map<string, ItemCatalogEntry>
): number {
  const equippedMeleeWeapons = character.inventory
    .filter((item) => item.status === 'equipped_main_hand' || item.status === 'equipped_off_hand')
    .map((item) => itemLookup.get(slugify(item.baseItemId)))
    .filter((item): item is ItemCatalogEntry => Boolean(item))
    .filter((item) => isWeapon(item) && String(item.type ?? '').split('|')[0] === 'M');

  return equippedMeleeWeapons.some((item) => weaponPropertySet(item).has('R')) ? 10 : 5;
}

function hasTwoWeaponFightingLoadout(
  character: CharacterRecord,
  itemLookup: Map<string, ItemCatalogEntry>
): boolean {
  const mainHand = character.inventory.find((item) => item.status === 'equipped_main_hand');
  const offHand = character.inventory.find((item) => item.status === 'equipped_off_hand');

  if (!mainHand || !offHand) {
    return false;
  }

  const mainHandDetail = itemLookup.get(slugify(mainHand.baseItemId));
  const offHandDetail = itemLookup.get(slugify(offHand.baseItemId));

  if (!mainHandDetail || !offHandDetail || !isWeapon(mainHandDetail) || !isWeapon(offHandDetail)) {
    return false;
  }

  return weaponPropertySet(mainHandDetail).has('L') && weaponPropertySet(offHandDetail).has('L');
}

function canMakeThrownAttack(item: ItemCatalogEntry): boolean {
  const typeCode = String(item.type ?? '').split('|')[0];
  return typeCode === 'M' && weaponPropertySet(item).has('T') && Boolean(item.range);
}

function normalizeDamageType(code: string | undefined): string {
  switch (String(code ?? '').toUpperCase()) {
    case 'B':
      return 'Bludgeoning';
    case 'P':
      return 'Piercing';
    case 'S':
      return 'Slashing';
    default:
      return '';
  }
}

function normalizeWeaponProperties(properties: string[]): string {
  const labels = properties
    .map((value) => String(value).split('|')[0])
    .map((code) => {
      switch (code) {
        case 'A':
          return 'Ammunition';
        case 'AF':
          return 'Automatic Fire';
        case 'BF':
          return 'Burst Fire';
        case 'F':
          return 'Finesse';
        case 'H':
          return 'Heavy';
        case 'L':
          return 'Light';
        case '2H':
          return 'Two-Handed';
        case 'T':
          return 'Thrown';
        case 'R':
          return 'Reach';
        case 'V':
          return 'Versatile';
        case 'LD':
          return 'Loading';
        case 'RLD':
          return 'Reload';
        default:
          return '';
      }
    })
    .filter(Boolean);

  return labels.join(', ');
}

function resourceRecoveryLabel(resourceId: string): string {
  if (resourceId.startsWith('bgSpell:')) return 'Long Rest Resource';
  if (resourceId === 'second_wind') return 'Short Rest Resource';
  return 'Limited Use Resource';
}

function actionIconForKind(kind: DerivedActionKind): string {
  return {
    action: 'A',
    bonus: 'BA',
    reaction: 'R',
    other: 'O',
    limited: 'LU',
    attack: 'ATK'
  }[kind];
}

function dedupeActions(actions: DerivedAction[]): DerivedAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    if (seen.has(action.id)) return false;
    seen.add(action.id);
    return true;
  });
}

function slugify(value: string): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleize(value: string): string {
  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}
