/**
 * Flag para habilitar derivacao de actions via backend (se disponível).
 * Habilitado por default - backend tem fallback local embutido.
 */
let useBackendDerivation = true;
export function enableBackendDerivation(enabled) {
    useBackendDerivation = enabled;
}
export function isBackendDerivationEnabled() {
    return useBackendDerivation;
}
/**
 * Deriva as acoes disponiveis usando backend se disponível, ou fallback local.
 * Esta é a função principal para derivar ações da ficha.
 */
export async function deriveAvailableActionsAsync(character, context) {
    if (useBackendDerivation) {
        try {
            const { deriveActions } = await import('../../lib/api-actions-client.js');
            const actions = await deriveActions(character);
            return actions;
        }
        catch (err) {
            console.warn('Backend action derivation failed, falling back to local:', err);
        }
    }
    return deriveAvailableActions(context);
}
const BASIC_ACTIONS = [
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
        cost: { economy: 'action' },
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
        detail: 'When you take the Dash action, you gain extra movement for the current turn. The increase equals your Speed after applying any modifiers.',
        cost: { economy: 'action' },
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
        detail: 'Until the start of your next turn, any attack roll made against you has Disadvantage if you can see the attacker, and you make Dexterity saving throws with Advantage.',
        cost: { economy: 'action' },
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
        notes: "Extra attack with eligible Light weapons.",
        detail: "When you make the extra attack of the Light property, you don't add your ability modifier to the extra attack's damage unless that modifier is negative.",
        cost: { economy: 'bonus' },
    },
    {
        id: 'rule:opportunity',
        kind: 'reaction',
        icon: 'R',
        name: 'Opportunity Attack',
        subtitle: 'Reaction',
        range: 'Reach',
        rangeLabel: 'Melee',
        hit: '--',
        damage: [],
        notes: 'A creature leaves your reach.',
        detail: 'You can make an Opportunity Attack when a creature that you can see leaves your reach using its action, Bonus Action, Reaction, or movement.',
        cost: { economy: 'reaction' },
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
        detail: 'You normally interact with one object or feature of the environment for free, during either your move or your action.',
        cost: { economy: 'free' },
    },
];
export function deriveAvailableActions(context) {
    const actions = [
        ...deriveAttackActions(context),
        ...deriveSpellActions(context),
        ...BASIC_ACTIONS,
        ...deriveFeatureActions(context),
    ];
    return actions.map((action) => ({
        ...action,
        disabled: isActionDisabled(action, context),
    }));
}
export function isActionDisabled(action, context) {
    if (action.resource && !hasResourceAvailable(context.character, action.resource))
        return true;
    if (action.slotLevel && !hasSpellSlotAvailable(context.character, action.slotLevel))
        return true;
    return false;
}
export function actionIconForKind(kind) {
    return {
        action: 'A',
        bonus: 'BA',
        reaction: 'R',
        other: 'O',
        limited: 'LU',
        attack: 'ATK',
    }[kind] ?? 'LU';
}
function deriveAttackActions(context) {
    const character = context.character ?? {};
    const projection = context.projection ?? {};
    const attackAbility = character.class === 'monk' || character.class === 'rogue' ? 'dex' : 'str';
    const abilityMod = projection.abilityModifiers?.[attackAbility] ?? 0;
    const hitBonus = (projection.proficiencyBonus ?? 0) + abilityMod;
    return (character.attacks ?? []).map((attack, index) => {
        const item = (character.inventory ?? []).find((entry) => entry.id === attack.itemId);
        return {
            id: `attack:${index}:${context.slugify(attack.name)}`,
            kind: 'attack',
            icon: 'ATK',
            name: attack.name,
            subtitle: item ? context.itemTypeLabel(item) : 'Weapon / Attack',
            range: context.compactRange(attack.range),
            rangeLabel: context.rangeLabel(attack.range),
            hit: context.signed(hitBonus),
            damage: [`${attack.damage}${context.signed(abilityMod)}`],
            notes: item ? context.itemTags(item).join(', ') : (attack.type ?? ''),
            detail: item ? context.entriesToText(item.entries) : '',
            source: { type: 'attack', itemId: attack.itemId },
            cost: { economy: 'action' },
        };
    });
}
function deriveSpellActions(context) {
    const character = context.character ?? {};
    const spellEntries = (character.spellEntries?.length
        ? character.spellEntries
        : (character.spells ?? []).map((name) => {
            const detail = context.spellDetails?.[name.toLowerCase()] ?? context.loadedSpellDetails?.[name] ?? null;
            return {
                name,
                level: Number(detail?.level) || 0,
                castMode: Number(detail?.level) > 0 ? 'slots' : 'at-will',
            };
        }));
    return spellEntries
        .map((entry) => {
        const detail = context.spellDetails?.[entry.name.toLowerCase()] ?? context.loadedSpellDetails?.[entry.name] ?? null;
        return detail ? { ...detail, castMode: entry.castMode, resourceId: entry.resourceId } : null;
    })
        .filter((spell) => Boolean(spell))
        .filter((spell) => spellActionVisible(spell, context))
        .map((spell) => {
        const kind = actionKindForSpell(spell, context);
        const slotLevel = spell.castMode === 'slots' && spell.level > 0 ? spell.level : null;
        const resourceId = spell.castMode === 'resource' ? spell.resourceId : undefined;
        return {
            id: `spell-action:${context.slugify(spell.name)}`,
            kind,
            icon: 'SPL',
            name: spell.name,
            subtitle: spell.level === 0 ? 'Cantrip' : `Magia nivel ${spell.level}`,
            range: context.compactRange(spell.range),
            rangeLabel: spell.range === 'Self' ? 'Self' : 'Range',
            hit: spellHitOrDc(spell, context),
            damage: spellDamageChips(spell.description),
            notes: spell.components || spell.levelLine || 'Magic',
            detail: spell.description ?? '',
            resource: resourceId,
            slotLevel,
            source: { type: 'spell', spellName: spell.name },
            cost: resourceId
                ? { resource: resourceId, economy: kind }
                : slotLevel
                    ? { resource: 'spell_slot', slotLevel, economy: kind }
                    : { economy: kind },
        };
    });
}
function deriveFeatureActions(context) {
    const items = [];
    (context.resourceDefinitions ?? []).forEach((resourceDef) => {
        if (resourceDef.kind === 'spell')
            return;
        const resource = context.character?.resources?.[resourceDef.id];
        const remaining = resource ? Math.max(0, Number(resource.max) - Number(resource.used)) : 0;
        const subtitle = resourceDef.kind === 'species' ? (resourceDef.sourceLabel ?? '') : `${resourceDef.className} Feature`;
        if (resourceDef.actionKind) {
            items.push({
                id: `feature:${resourceDef.id}`,
                kind: resourceDef.actionKind,
                icon: actionIconForKind(resourceDef.actionKind),
                name: resourceDef.name,
                subtitle,
                range: 'Self',
                rangeLabel: 'Resource',
                hit: '--',
                damage: [],
                notes: `${remaining}/${resource?.max ?? 0} uses`,
                detail: resourceDef.body,
                resource: resourceDef.id,
                source: { type: 'feature', resourceId: resourceDef.id },
                cost: { resource: resourceDef.id, economy: resourceDef.actionKind },
            });
        }
        items.push({
            id: `limited:${resourceDef.id}`,
            kind: 'limited',
            icon: 'LU',
            name: `${resourceDef.name} Uses`,
            subtitle: context.resourceRecoveryLabel(resourceDef.recovery),
            range: 'Self',
            rangeLabel: 'Resource',
            hit: '--',
            damage: [],
            notes: `${remaining}/${resource?.max ?? 0} disponivel`,
            detail: resourceDef.body,
            resource: resourceDef.id,
            source: { type: 'resource', resourceId: resourceDef.id },
            cost: { resource: resourceDef.id },
        });
    });
    return items;
}
function spellActionVisible(spell, context) {
    const kind = actionKindForSpell(spell, context);
    if (kind === 'bonus' || kind === 'reaction')
        return true;
    const damage = spellDamageChips(spell.description);
    const hit = spellHitOrDc(spell, context);
    if (kind === 'attack')
        return damage.length > 0 || hit !== '--';
    return spell.level > 0 || (spell.level === 0 && kind === 'action');
}
function actionKindForSpell(spell, context) {
    const text = String(spell.castingTime).toLowerCase();
    if (text.includes('bonus'))
        return 'bonus';
    if (text.includes('reaction'))
        return 'reaction';
    if (spellDamageChips(spell.description).length || spellHitOrDc(spell, context) !== '--')
        return 'attack';
    if (/ritual/i.test(`${spell.name} ${spell.description ?? ''}`))
        return 'other';
    return actionKindFromCastingTime(spell.castingTime);
}
function actionKindFromCastingTime(castingTime = '') {
    const text = String(castingTime).toLowerCase();
    if (text.includes('bonus'))
        return 'bonus';
    if (text.includes('reaction'))
        return 'reaction';
    if (text.includes('action'))
        return 'action';
    return 'other';
}
function spellHitOrDc(spell, context) {
    const description = String(spell.description ?? '').toLowerCase();
    if (description.includes('saving throw'))
        return String(context.projection?.spellSaveDc ?? '--');
    if (description.includes('spell attack'))
        return context.signed(context.projection?.spellAttack ?? 0);
    return '--';
}
function spellDamageChips(description = '') {
    const matches = [...String(description).matchAll(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi)].map((match) => match[0].replace(/\s+/g, ''));
    return [...new Set(matches)].slice(0, 2);
}
function hasResourceAvailable(character, resourceId) {
    const resource = character?.resources?.[resourceId];
    return Boolean(resource && Number(resource.used) < Number(resource.max));
}
function hasSpellSlotAvailable(character, level) {
    const slot = character?.spellSlots?.[level];
    return Boolean(slot && Number(slot.used) < Number(slot.max));
}
//# sourceMappingURL=action-engine.js.map