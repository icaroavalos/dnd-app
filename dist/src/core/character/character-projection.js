/**
 * Character Projection - Deriva o estado completo para exibição (combate, perícias, etc)
 *
 * Esta é a única fonte de verdade para o que é exibido na ficha.
 */
import { calculateCharacterAbilityBonuses } from './ability-bonuses.js';
import { deriveAbilityModifier, deriveAbilityScores, deriveMaxHp, deriveProficiencyBonus, deriveSavingThrowBonus } from './character-engine.js';
const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
/**
 * Deriva os dados da ficha baseados no estado bruto do personagem
 */
export function deriveCharacterSheet(character, options = {}) {
    const level = Math.max(1, Number(character.level) || 1);
    const proficiencyBonus = deriveProficiencyBonus(level);
    // 1. Ability Scores
    const abilityBonuses = calculateCharacterAbilityBonuses(character);
    const abilityScores = deriveAbilityScores(character.abilities ?? {}, abilityBonuses);
    // 2. Modifiers
    const abilityModifiers = {
        str: deriveAbilityModifier(abilityScores.str),
        dex: deriveAbilityModifier(abilityScores.dex),
        con: deriveAbilityModifier(abilityScores.con),
        int: deriveAbilityModifier(abilityScores.int),
        wis: deriveAbilityModifier(abilityScores.wis),
        cha: deriveAbilityModifier(abilityScores.cha),
    };
    // 3. Saving Throws
    const savingThrows = {};
    ABILITY_KEYS.forEach(key => {
        const isProficient = (character.savingThrows ?? []).includes(key);
        savingThrows[key] = deriveSavingThrowBonus(abilityScores[key], isProficient, proficiencyBonus);
    });
    // 4. Skills
    const skillBonuses = {};
    if (options.skills) {
        options.skills.forEach(([name, ability]) => {
            const isProficient = (character.skillProficiencies ?? []).includes(name);
            const isSpecialDruid = character.class === 'druid' &&
                character.classFeatureChoices?.['primal-order'] === 'magician' &&
                character.classFeatureChoices?.['magician-skill'] === slugify(name);
            let bonus = abilityModifiers[ability] + (isProficient ? proficiencyBonus : 0);
            if (isSpecialDruid) {
                bonus += Math.max(1, abilityModifiers.wis);
            }
            skillBonuses[name] = bonus;
        });
    }
    // 5. HP & Hit Die
    const hitDie = options.hitDie ?? (options.apiClasses?.[character.class]?.hit_die ?? 8);
    const maxHp = Number(character.maxHp) || deriveMaxHp(level, hitDie, abilityModifiers.con);
    // 6. Spellcasting
    const spellAbility = options.spellAbility ?? (character.class === 'cleric' || character.class === 'druid' ? 'wis' : 'int');
    const spellAttack = proficiencyBonus + abilityModifiers[spellAbility];
    const spellSaveDc = 8 + spellAttack;
    // 7. Spell Slots (from API levels data if provided)
    const spellSlotsMax = {};
    if (options.apiLevels && options.apiLevels[character.class]) {
        const levelRow = options.apiLevels[character.class].find(r => r.level === level);
        if (levelRow?.spellcasting) {
            for (let i = 1; i <= 9; i++) {
                const val = levelRow.spellcasting[`spell_slots_level_${i}`];
                if (val)
                    spellSlotsMax[i] = Number(val);
            }
        }
    }
    return {
        level,
        proficiencyBonus,
        abilityScores,
        abilityModifiers,
        savingThrows,
        skillBonuses,
        passivePerception: 10 + (skillBonuses['Perception'] ?? abilityModifiers.wis),
        armorClass: character.armorClass ?? (10 + abilityModifiers.dex),
        initiative: abilityModifiers.dex,
        maxHp,
        currentHp: Number(character.hp) || maxHp,
        tempHp: Math.max(0, Number(character.tempHp) || 0),
        hitDie,
        hitDiceTotal: level,
        spellAttack,
        spellSaveDc,
        spellSlotsMax,
        encumbrance: {
            carriedWeight: 0, // A ser implementado com o motor de itens
            carryingCapacity: abilityScores.str * 15,
            encumbered: false
        }
    };
}
export function deriveProjectedAbilityScores(character) {
    const abilityBonuses = calculateCharacterAbilityBonuses(character);
    return deriveAbilityScores(character.abilities ?? {}, abilityBonuses);
}
export function deriveProjectedAbilityScore(character, ability, options = {}) {
    const abilityBonuses = calculateCharacterAbilityBonuses(character, options);
    return deriveAbilityScores(character.abilities ?? {}, abilityBonuses)[ability];
}
export function deriveProjectedAbilityModifier(character, ability) {
    return deriveAbilityModifier(deriveProjectedAbilityScore(character, ability));
}
export function deriveProjectedProficiencyBonus(character, derivedSheet) {
    return Number(derivedSheet?.proficiencyBonus) || deriveProficiencyBonus(Number(character.level) || 1);
}
export function deriveProjectedSaveBonus(character, ability, options = {}) {
    const proficiencyBonus = deriveProjectedProficiencyBonus(character, options.derivedSheet);
    const base = deriveSavingThrowBonus(deriveProjectedAbilityScore(character, ability), (character.savingThrows ?? []).includes(ability), proficiencyBonus);
    const derivedSave = options.derivedSheet?.savingThrows?.[ability];
    if (derivedSave == null)
        return base;
    const derivedBase = deriveSavingThrowBonus((options.derivedSheet?.abilityScores?.[ability] ?? deriveProjectedAbilityScore(character, ability)) || 10, (character.savingThrows ?? []).includes(ability), proficiencyBonus);
    return base + (derivedSave - derivedBase);
}
export function deriveProjectedSkillBonus(character, skillName, options = {}) {
    const derivedBonus = options.derivedSheet?.skillBonuses?.[skillName];
    if (derivedBonus != null)
        return derivedBonus;
    const ability = options.skills?.find(([name]) => name === skillName)?.[1] ?? 'dex';
    const proficiencyBonus = deriveProjectedProficiencyBonus(character, options.derivedSheet);
    return deriveProjectedAbilityModifier(character, ability) +
        ((character.skillProficiencies ?? []).includes(skillName) ? proficiencyBonus : 0) +
        deriveProjectedSkillChoiceBonus(character, skillName, options.slugify);
}
function deriveProjectedSkillChoiceBonus(character, skillName, slugifyFn) {
    const choices = character.classFeatureChoices ?? {};
    if (character.class === 'druid' && choices['primal-order'] === 'magician') {
        const target = choices['magician-skill'];
        const normalize = slugifyFn ?? slugify;
        if (target && normalize(skillName) === target)
            return Math.max(1, deriveProjectedAbilityModifier(character, 'wis'));
    }
    return 0;
}
function slugify(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
//# sourceMappingURL=character-projection.js.map