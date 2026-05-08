var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable } from '@nestjs/common';
import { countAmmoInInventory, resolveAmmoGroup } from '../inventory/ammo-rules.js';
import { CharactersService } from '../characters/characters.service.js';
import { RulesService } from '../rules/rules.service.js';
const CANONICAL_RESOURCE_META = {
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
let ActionsService = class ActionsService {
    rulesService;
    charactersService;
    constructor(rulesService, charactersService) {
        this.rulesService = rulesService;
        this.charactersService = charactersService;
    }
    async deriveActions(character) {
        const [projection, spellsCatalog, classSpellsCatalog, itemsCatalog] = await Promise.all([
            this.charactersService.projectCharacter(character),
            this.rulesService.getCatalog('spells'),
            this.rulesService.getCatalog('class-spells'),
            this.rulesService.getCatalog('items')
        ]);
        const spellDetails = createSpellLookup(spellsCatalog.results);
        const itemDetails = createItemLookup(itemsCatalog.results);
        const classSpellNames = resolveClassSpellNames(character, classSpellsCatalog.results);
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
};
ActionsService = __decorate([
    Injectable(),
    __param(0, Inject(RulesService)),
    __param(1, Inject(CharactersService)),
    __metadata("design:paramtypes", [RulesService,
        CharactersService])
], ActionsService);
export { ActionsService };
function deriveBasicActions(character, itemLookup) {
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
function deriveAttackActions(character, projection, itemLookup) {
    const explicitActions = (character.attacks ?? []).map((attack, index) => createExplicitAttackAction(attack, index, character, projection));
    const explicitItemIds = new Set((character.attacks ?? [])
        .map((attack) => attack.itemId ?? null)
        .filter((itemId) => Boolean(itemId)));
    const derivedFromInventory = deriveInventoryAttackActions(character, projection, itemLookup).filter((action) => {
        const itemId = typeof action.source?.itemId === 'string' ? action.source.itemId : null;
        return !itemId || !explicitItemIds.has(itemId);
    });
    return [...explicitActions, ...derivedFromInventory];
}
function createExplicitAttackAction(attack, index, character, projection) {
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
function deriveInventoryAttackActions(character, projection, itemLookup) {
    const actions = [];
    for (const item of character.inventory) {
        if (item.status !== 'equipped_main_hand' && item.status !== 'equipped_off_hand') {
            continue;
        }
        const detail = itemLookup.get(slugify(item.baseItemId));
        if (!detail || !isWeapon(detail)) {
            continue;
        }
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
        actions.push(createInventoryAttackAction({
            instanceId: item.instanceId,
            baseItemId: item.baseItemId,
            item: detail,
            hitBonus,
            abilityMod,
            weaponDamage,
            ammoState,
            detailText,
            twoHandedBlocked,
            loadingBlocked
        }));
        if (canMakeThrownAttack(detail)) {
            actions.push(createInventoryAttackAction({
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
            }));
        }
    }
    return actions;
}
function createInventoryAttackAction(input) {
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
            thrownVariant: isThrownVariant
        },
        cost: { economy: 'action' }
    };
}
function deriveClassSpellActions(character, projection, spellLookup, classSpellNames) {
    const actions = [];
    for (const spellName of character.spells ?? []) {
        if (!classSpellNames.has(slugify(spellName)))
            continue;
        const detail = spellLookup.get(slugify(spellName));
        if (!detail)
            continue;
        const level = Number(detail.level) || 0;
        const action = createSpellAction(detail, projection, {
            castMode: level > 0 ? 'slots' : 'at-will'
        });
        if (action)
            actions.push(action);
    }
    return dedupeActions(actions);
}
function deriveSpellActions(character, projection, spellLookup) {
    const actions = [];
    for (const choice of character.spellChoices) {
        for (const cantripName of choice.selectedCantrips) {
            const detail = spellLookup.get(slugify(cantripName));
            if (!detail)
                continue;
            const action = createSpellAction(detail, projection, { castMode: 'at-will' });
            if (action)
                actions.push(action);
        }
        for (const spellName of choice.selectedLevel1Spells) {
            const detail = spellLookup.get(slugify(spellName));
            if (!detail)
                continue;
            const action = createSpellAction(detail, projection, {
                castMode: 'resource',
                resourceId: `bgSpell:${slugify(spellName)}`
            });
            if (action)
                actions.push(action);
        }
    }
    return dedupeActions(actions);
}
function createSpellAction(detail, projection, options) {
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
function deriveResourceActions(character) {
    const actions = [];
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
function resolveResourceMeta(resourceId) {
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
function actionKindForSpell(detail, description) {
    const castingTime = detail.time?.[0]?.unit?.toLowerCase() ?? '';
    const lowerDescription = description.toLowerCase();
    if (castingTime.includes('bonus'))
        return 'bonus';
    if (castingTime.includes('reaction'))
        return 'reaction';
    if (lowerDescription.includes('saving throw') ||
        lowerDescription.includes('spell attack') ||
        lowerDescription.includes(' damage')) {
        return 'attack';
    }
    return castingTime.includes('action') ? 'action' : 'other';
}
function spellActionVisible(level, kind, description, projection) {
    if (kind === 'bonus' || kind === 'reaction')
        return true;
    const damage = spellDamageChips(description);
    const hit = spellHitOrDc(description, projection);
    if (kind === 'attack')
        return damage.length > 0 || hit !== '--';
    return level > 0 || (level === 0 && kind === 'action');
}
function spellHitOrDc(description, projection) {
    const text = String(description).toLowerCase();
    if (text.includes('saving throw'))
        return String(projection.spellcasting?.saveDc ?? '--');
    if (text.includes('spell attack'))
        return signed(projection.spellcasting?.attackBonus ?? 0);
    return '--';
}
function spellDamageChips(description = '') {
    const matches = [...String(description).matchAll(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi)].map((match) => match[0].replace(/\s+/g, ''));
    return [...new Set(matches)].slice(0, 2);
}
function createSpellLookup(entries) {
    return new Map(entries.map((entry) => [slugify(entry.name), entry]));
}
function createItemLookup(entries) {
    return new Map(entries.map((entry) => [slugify(entry.name), entry]));
}
function compactRange(range) {
    if (!range?.distance)
        return '--';
    if (range.distance.type === 'touch')
        return 'Touch';
    if (range.distance.type === 'self')
        return 'Self';
    if (range.distance.type === 'feet' && range.distance.amount)
        return `${range.distance.amount} feet`;
    return titleize(range.distance.type ?? range.type ?? '--');
}
function rangeLabel(range) {
    const compact = compactRange(range);
    return compact === 'Self' || compact === 'Touch' ? compact : 'Range';
}
function componentsLabel(components) {
    if (!components)
        return 'Magic';
    const labels = ['v', 's', 'm']
        .filter((key) => components[key])
        .map((key) => key.toUpperCase());
    return labels.length ? labels.join(', ') : 'Magic';
}
function entriesToText(entries) {
    return entries.map((entry) => clean5etoolsText(entry)).join('\n\n').trim();
}
function clean5etoolsText(value) {
    return String(value ?? '')
        .replace(/\{@(?:spell|item|condition|skill|sense|variantrule|filter|hazard|scaledamage|damage|feat|action|book)\s+([^|}]+)(?:\|[^}]*)?}/g, '$1')
        .replace(/\{@(?:dice|hit|d20|chance)\s+([^|}]+)(?:\|[^}]*)?}/g, '$1')
        .replace(/\{@i\s+([^}]+)}/g, '$1')
        .replace(/\{@b\s+([^}]+)}/g, '$1')
        .replace(/\{@[^}]+\}/g, '')
        .trim();
}
function isActionDisabled(action, character, projection) {
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
function resolveClassSpellNames(character, classSpellEntries) {
    const primaryClass = slugify(character.classes[0]?.classId ?? '');
    const entry = classSpellEntries.find((candidate) => slugify(candidate.className ?? '') === primaryClass);
    return new Set((entry?.spells ?? []).map((spell) => slugify(spell.name)));
}
function resolveAttackAbilityForExplicitAttack(attack, character) {
    if (String(attack.range ?? '').includes('/')) {
        return 'dex';
    }
    const classId = slugify(character.classes[0]?.classId ?? '');
    return classId === 'monk' || classId === 'rogue' ? 'dex' : 'str';
}
function resolveAttackAbilityForItem(item, projection) {
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
function isWeapon(item) {
    const typeCode = String(item.type ?? '').split('|')[0];
    return Boolean(item.dmg1) && (typeCode === 'M' || typeCode === 'R');
}
function weaponPropertySet(item) {
    return new Set((item.property ?? []).map((value) => String(value).split('|')[0]));
}
function buildWeaponDetail(item, ammoState, blockers) {
    const parts = [weaponNotes(item, ammoState)];
    if (blockers.twoHandedBlocked) {
        parts.push('Blocked: this weapon requires two hands.');
    }
    if (blockers.loadingBlocked) {
        parts.push('Blocked: this weapon requires a free hand to load.');
    }
    return parts.filter(Boolean).join(' ');
}
function normalizeWeaponRange(item) {
    if (canMakeThrownAttack(item)) {
        return '5 feet';
    }
    return item.range ? String(item.range) : '5 feet';
}
function normalizeThrownRange(item) {
    return item.range ? String(item.range) : '20/60';
}
function resolveInventoryWeaponDamage(instanceId, item, inventory) {
    const properties = weaponPropertySet(item);
    if (!properties.has('V')) {
        return String(item.dmg1);
    }
    if (!canUseVersatileDamage(instanceId, inventory)) {
        return String(item.dmg1);
    }
    return versatileDamageForBase(String(item.dmg1));
}
function canUseVersatileDamage(instanceId, inventory) {
    const currentItem = inventory.find((item) => item.instanceId === instanceId);
    if (!currentItem || currentItem.status !== 'equipped_main_hand') {
        return false;
    }
    return !inventory.some((item) => {
        if (item.instanceId === instanceId)
            return false;
        return item.status === 'equipped_off_hand' || item.status === 'equipped_shield';
    });
}
function isTwoHandedWeaponBlocked(instanceId, item, inventory) {
    if (!weaponPropertySet(item).has('2H')) {
        return false;
    }
    return inventory.some((candidate) => {
        if (candidate.instanceId === instanceId)
            return false;
        return candidate.status === 'equipped_off_hand' || candidate.status === 'equipped_shield';
    });
}
function requiresFreeHandToLoad(item) {
    const properties = weaponPropertySet(item);
    return properties.has('A') && !properties.has('2H');
}
function hasFreeHandToLoad(instanceId, item, inventory) {
    if (!requiresFreeHandToLoad(item)) {
        return true;
    }
    return !inventory.some((candidate) => {
        if (candidate.instanceId === instanceId)
            return false;
        return candidate.status === 'equipped_off_hand' || candidate.status === 'equipped_shield';
    });
}
function versatileDamageForBase(baseDamage) {
    switch (baseDamage) {
        case '1d6':
            return '1d8';
        case '1d8':
            return '1d10';
        default:
            return baseDamage;
    }
}
function weaponRangeLabel(item) {
    const typeCode = String(item.type ?? '').split('|')[0];
    if (canMakeThrownAttack(item)) {
        return 'Melee';
    }
    return typeCode === 'R' || Boolean(item.range) ? 'Ranged' : 'Melee';
}
function weaponNotes(item, ammoState) {
    const parts = [
        normalizeDamageType(item.dmgType),
        normalizeWeaponProperties(item.property ?? []),
        ammoState?.required ? `Ammo: ${ammoState.count}` : ''
    ].filter(Boolean);
    return parts.join(' • ') || 'Weapon attack';
}
function resolveAmmoState(item, inventory) {
    const ammoGroup = resolveAmmoGroup(item);
    if (!ammoGroup) {
        return { required: false, count: 0 };
    }
    return { required: true, count: countAmmoInInventory(inventory, ammoGroup) };
}
function resolveOpportunityReach(character, itemLookup) {
    const equippedMeleeWeapons = character.inventory
        .filter((item) => item.status === 'equipped_main_hand' || item.status === 'equipped_off_hand')
        .map((item) => itemLookup.get(slugify(item.baseItemId)))
        .filter((item) => Boolean(item))
        .filter((item) => isWeapon(item) && String(item.type ?? '').split('|')[0] === 'M');
    return equippedMeleeWeapons.some((item) => weaponPropertySet(item).has('R')) ? 10 : 5;
}
function hasTwoWeaponFightingLoadout(character, itemLookup) {
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
function canMakeThrownAttack(item) {
    const typeCode = String(item.type ?? '').split('|')[0];
    return typeCode === 'M' && weaponPropertySet(item).has('T') && Boolean(item.range);
}
function normalizeDamageType(code) {
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
function normalizeWeaponProperties(properties) {
    const labels = properties
        .map((value) => String(value).split('|')[0])
        .map((code) => {
        switch (code) {
            case 'A':
                return 'Ammunition';
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
function resourceRecoveryLabel(resourceId) {
    if (resourceId.startsWith('bgSpell:'))
        return 'Long Rest Resource';
    if (resourceId === 'second_wind')
        return 'Short Rest Resource';
    return 'Limited Use Resource';
}
function actionIconForKind(kind) {
    return {
        action: 'A',
        bonus: 'BA',
        reaction: 'R',
        other: 'O',
        limited: 'LU',
        attack: 'ATK'
    }[kind];
}
function dedupeActions(actions) {
    const seen = new Set();
    return actions.filter((action) => {
        if (seen.has(action.id))
            return false;
        seen.add(action.id);
        return true;
    });
}
function slugify(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
function titleize(value) {
    return String(value)
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
function signed(value) {
    return value >= 0 ? `+${value}` : `${value}`;
}
//# sourceMappingURL=actions.service.js.map