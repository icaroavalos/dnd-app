/**
 * Local Character Projection - Projeção local para edição offline.
 *
 * Este modulo e usado apenas para projecao durante edicao local.
 * Para projecao canonica, use projectCharacterSheet de character-projection.ts.
 */

import type { AbilityName } from '../../types/background.js';
import type { Character, DerivedCharacterSheet, AbilityScores } from '../../types/state.js';
import { calculateCharacterAbilityBonuses } from './ability-bonuses.js';
import {
  deriveAbilityModifier,
  deriveAbilityScores,
  deriveMaxHp,
  deriveProficiencyBonus,
  deriveSavingThrowBonus
} from './character-engine.js';

export interface ProjectionOptions {
  skills?: [string, AbilityName][];
  activeModifiers?: any[];
  spellAbility?: AbilityName;
  hitDie?: number;
  apiClasses?: Record<string, any>;
  apiLevels?: Record<string, any[]>;
}

export interface ProjectionHelperOptions {
  derivedSheet?: Partial<DerivedCharacterSheet> | null;
  omitAsiRuleId?: string;
  skills?: [string, AbilityName][];
  slugify?: (value: string) => string;
}

/**
 * Deriva os dados da ficha baseados no estado bruto do personagem (projeção local).
 * Use apenas para edicao offline. Para projecao canonica, use backend.
 */
export function deriveCharacterSheet(
  character: Character,
  options: ProjectionOptions = {}
): DerivedCharacterSheet {
  const level = Math.max(1, Number(character.level) || 1);
  const proficiencyBonus = deriveProficiencyBonus(level);

  // 1. Ability Scores
  const abilityBonuses = calculateCharacterAbilityBonuses(character);
  const abilityScores = deriveAbilityScores(character.abilities ?? {}, abilityBonuses);

  // 2. Modifiers
  const abilityModifiers: AbilityScores = {
    str: deriveAbilityModifier(abilityScores.str),
    dex: deriveAbilityModifier(abilityScores.dex),
    con: deriveAbilityModifier(abilityScores.con),
    int: deriveAbilityModifier(abilityScores.int),
    wis: deriveAbilityModifier(abilityScores.wis),
    cha: deriveAbilityModifier(abilityScores.cha),
  };

  // 3. Saving Throws
  const savingThrows: Record<string, number> = {};
  const ABILITY_KEYS: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  ABILITY_KEYS.forEach(key => {
    const isProficient = (character.savingThrows ?? []).includes(key);
    savingThrows[key] = deriveSavingThrowBonus(abilityScores[key], isProficient, proficiencyBonus);
  });

  // 4. Skills
  const skillBonuses: Record<string, number> = {};
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
  const spellSlotsMax: Record<string, number> = {};
  if (options.apiLevels && options.apiLevels[character.class]) {
    const levelRow = options.apiLevels[character.class].find(r => r.level === level);
    if (levelRow?.spellcasting) {
      for (let i = 1; i <= 9; i++) {
        const val = levelRow.spellcasting[`spell_slots_level_${i}`];
        if (val) spellSlotsMax[i] = Number(val);
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
      carriedWeight: 0,
      carryingCapacity: abilityScores.str * 15,
      encumbered: false
    }
  };
}

export function deriveProjectedAbilityScores(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>
): AbilityScores {
  const abilityBonuses = calculateCharacterAbilityBonuses(character);
  return deriveAbilityScores(character.abilities ?? {}, abilityBonuses);
}

export function deriveProjectedAbilityScore(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
  ability: AbilityName,
  options: { omitAsiRuleId?: string } = {}
): number {
  const abilityBonuses = calculateCharacterAbilityBonuses(character, options);
  return deriveAbilityScores(character.abilities ?? {}, abilityBonuses)[ability];
}

export function deriveProjectedAbilityModifier(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices'>,
  ability: AbilityName
): number {
  return deriveAbilityModifier(deriveProjectedAbilityScore(character, ability));
}

export function deriveProjectedProficiencyBonus(
  character: Pick<Character, 'level'>,
  derivedSheet?: Partial<DerivedCharacterSheet> | null
): number {
  return Number(derivedSheet?.proficiencyBonus) || deriveProficiencyBonus(Number(character.level) || 1);
}

export function deriveProjectedSaveBonus(
  character: Pick<Character, 'abilities' | 'asiChoices' | 'bgChoices' | 'savingThrows' | 'level'>,
  ability: AbilityName,
  options: ProjectionHelperOptions = {}
): number {
  const proficiencyBonus = deriveProjectedProficiencyBonus(character, options.derivedSheet);
  const base = deriveSavingThrowBonus(
    deriveProjectedAbilityScore(character, ability),
    (character.savingThrows ?? []).includes(ability),
    proficiencyBonus
  );
  const derivedSave = options.derivedSheet?.savingThrows?.[ability];
  if (derivedSave == null) return base;

  const derivedBase = deriveSavingThrowBonus(
    (options.derivedSheet?.abilityScores?.[ability] ?? deriveProjectedAbilityScore(character, ability)) || 10,
    (character.savingThrows ?? []).includes(ability),
    proficiencyBonus
  );
  return base + (derivedSave - derivedBase);
}

export function deriveProjectedSkillBonus(
  character: Pick<Character, 'class' | 'classFeatureChoices' | 'skillProficiencies' | 'abilities' | 'asiChoices' | 'bgChoices' | 'level'>,
  skillName: string,
  options: ProjectionHelperOptions = {}
): number {
  const derivedBonus = options.derivedSheet?.skillBonuses?.[skillName];
  if (derivedBonus != null) return derivedBonus;

  const ability = options.skills?.find(([name]) => name === skillName)?.[1] ?? 'dex';
  const proficiencyBonus = deriveProjectedProficiencyBonus(character, options.derivedSheet);
  return deriveProjectedAbilityModifier(character, ability) +
    ((character.skillProficiencies ?? []).includes(skillName) ? proficiencyBonus : 0) +
    deriveProjectedSkillChoiceBonus(character, skillName, options.slugify);
}

function deriveProjectedSkillChoiceBonus(
  character: Pick<Character, 'class' | 'classFeatureChoices' | 'abilities' | 'asiChoices' | 'bgChoices'>,
  skillName: string,
  slugifyFn?: (value: string) => string
): number {
  const choices = character.classFeatureChoices ?? {};
  if (character.class === 'druid' && choices['primal-order'] === 'magician') {
    const target = choices['magician-skill'];
    const normalize = slugifyFn ?? slugify;
    if (target && normalize(skillName) === target) return Math.max(1, deriveProjectedAbilityModifier(character, 'wis'));
  }
  return 0;
}

function slugify(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
