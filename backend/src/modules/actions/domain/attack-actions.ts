import type { DerivedAction, DerivedCharacterSheet, CharacterAttack } from '@shared/contracts';
import { slugify, signed } from './utils.js';
import { resolveInventoryWeaponDamage, isWeapon, weaponPropertySet } from './weapon-helpers.js';
import { resolveAmmoState, isTwoHandedWeaponBlocked, hasFreeHandToLoad, requiresFreeHandToLoad, buildWeaponDetail, canMakeThrownAttack, normalizeWeaponRange, normalizeThrownRange, weaponRangeLabel, weaponNotes } from './weapon-helpers.js';
import { resolveAttackAbilityForExplicitAttack, resolveAttackAbilityForItem } from './action-ability.js';

interface ItemCatalogEntry {
  name: string;
  dmg1?: string;
  dmgType?: string;
  range?: string;
  property?: string[];
  type?: string;
}

export interface CreateInventoryAttackActionInput {
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
}

export function deriveAttackActions(
  character: any,
  projection: DerivedCharacterSheet,
  itemLookup: Map<string, ItemCatalogEntry>
): DerivedAction[] {
  const explicitActions = (character.attacks ?? []).map((attack: CharacterAttack, index: number) =>
    createExplicitAttackAction(attack, index, character, projection)
  );
  const explicitItemIds = new Set(
    (character.attacks ?? [])
      .map((attack: CharacterAttack) => attack.itemId ?? null)
      .filter((itemId: string | null): itemId is string => Boolean(itemId))
  );

  const derivedFromInventory = deriveInventoryAttackActions(character, projection, itemLookup).filter((action) => {
    const itemId = typeof action.source?.itemId === 'string' ? action.source.itemId : null;
    return !itemId || !explicitItemIds.has(itemId);
  });

  return [...explicitActions, ...derivedFromInventory];
}

export function createExplicitAttackAction(
  attack: CharacterAttack,
  index: number,
  character: any,
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

export function deriveInventoryAttackActions(
  character: any,
  projection: DerivedCharacterSheet,
  itemLookup: Map<string, ItemCatalogEntry>
): DerivedAction[] {
  const actions: DerivedAction[] = [];

  for (const item of character.inventory) {
    if (item.status !== 'equipped_main_hand' && item.status !== 'equipped_off_hand') {
      continue;
    }

    const lookupId = slugify(String(item.baseItemId).split('|')[0]);
    const detail = itemLookup.get(lookupId);
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

export function createInventoryAttackAction(input: CreateInventoryAttackActionInput): DerivedAction {
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
