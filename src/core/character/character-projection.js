import { createFormulaContext, evaluateFormula } from "../engine/expression-evaluator.js";
import { deriveCarriedWeight, modifierTotal } from "../engine/modifier-engine.js";
import { calculateCharacterAbilityBonuses } from "../../../dist/src/core/character/ability-bonuses.js";

const DEFAULT_ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

export function deriveCharacterSheet(character, options = {}) {
  const abilityKeys = options.abilityKeys ?? DEFAULT_ABILITY_KEYS;
  const skills = options.skills ?? [];
  const level = Math.max(1, Number(character?.level) || 1);
  const proficiencyBonus = proficiencyForLevel(level);
  const activeModifiers = options.modifiers ?? [];
  const abilityBonuses = calculateCharacterAbilityBonuses(character ?? {});
  const abilityScores = Object.fromEntries(
    abilityKeys.map((key) => [key, clamp((Number(character?.abilities?.[key]) || 10) + (abilityBonuses[key] ?? 0), 1, 30)])
  );
  const abilityModifiers = Object.fromEntries(
    abilityKeys.map((key) => [key, abilityModifier(abilityScores[key])])
  );
  const savingThrows = Object.fromEntries(
    abilityKeys.map((key) => [
      key,
      abilityModifiers[key] +
        ((character?.savingThrows ?? []).includes(key) ? proficiencyBonus : 0) +
        modifierTotal(activeModifiers, "saving_throws") +
        modifierTotal(activeModifiers, `save:${key}`),
    ])
  );
  const skillBonuses = Object.fromEntries(
    skills.map(([name, ability]) => [
      name,
      (abilityModifiers[ability] ?? 0) +
        ((character?.skillProficiencies ?? []).includes(name) ? proficiencyBonus : 0) +
        skillChoiceBonus(character, name, abilityModifiers) +
        modifierTotal(activeModifiers, "ability_checks") +
        modifierTotal(activeModifiers, `ability_check:${ability}`) +
        modifierTotal(activeModifiers, `skill:${slugify(name)}`),
    ])
  );
  const classRule = options.rules?.findByType?.("feature")?.find((rule) => rule.uuid === `class:${character?.class}`);
  const hitDie = Number(classRule?.raw?.hit_die ?? classRule?.raw?.hitDie ?? options.defaultHitDie ?? 8) || 8;
  const maxHp = maxHitPoints(level, hitDie, abilityModifiers.con ?? 0);
  const formulaContext = createFormulaContext({ proficiencyBonus, abilityModifiers });
  const spellAbility = options.spellAbility ?? "wis";
  const carriedWeight = deriveCarriedWeight(character);
  const carryingCapacity = Math.max(0, (abilityScores.str ?? 10) * 15);

  return {
    level,
    proficiencyBonus,
    abilityScores,
    abilityModifiers,
    savingThrows,
    skillBonuses,
    activeModifiers,
    encumbrance: {
      carriedWeight,
      carryingCapacity,
      encumbered: carryingCapacity > 0 && carriedWeight > carryingCapacity,
    },
    armorClass: (options.baseArmorClass ?? 10 + (abilityModifiers.dex ?? 0)) + modifierTotal(activeModifiers, "armor_class"),
    hitDie,
    maxHp,
    spellAttack: proficiencyBonus + (abilityModifiers[spellAbility] ?? 0),
    spellSaveDc: evaluateFormula(`8 + @prof + @${spellAbility}_mod`, formulaContext),
    formulaContext,
  };
}

export function proficiencyForLevel(level) {
  return Math.ceil((Number(level) || 1) / 4) + 1;
}

export function abilityModifier(score) {
  return Math.floor(((Number(score) || 10) - 10) / 2);
}

function skillChoiceBonus(character, name, abilityModifiers) {
  const choices = character?.classFeatureChoices ?? {};
  if (character?.class === "druid" && choices["primal-order"] === "magician") {
    const target = choices["magician-skill"];
    if (target && slugify(name) === target) return Math.max(1, abilityModifiers.wis ?? 0);
  }
  return 0;
}

function maxHitPoints(level, hitDie, conMod) {
  const first = Math.max(1, hitDie + conMod);
  const later = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
  return first + Math.max(0, level - 1) * later;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
