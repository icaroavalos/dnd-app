/**
 * Character Projection - Deriva o estado completo para exibição (combate, perícias, etc)
 *
 * Esta é a única fonte de verdade para o que é exibido na ficha.
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

const ABILITY_KEYS: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export interface ProjectionOptions {
  skills?: [string, AbilityName][];
  activeModifiers?: any[];
  spellAbility?: AbilityName;
  hitDie?: number;
  apiClasses?: Record<string, any>;
  apiLevels?: Record<string, any[]>;
}

/**
 * Deriva os dados da ficha baseados no estado bruto do personagem
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
  const hitDie = options.hitDie ?? 8;
  const maxHp = deriveMaxHp(level, hitDie, abilityModifiers.con);

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

function slugify(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
