import { useCharacterStore } from '../store/useCharacterStore';
import type { AbilityScores } from '../types/character';

export const useDerivedState = () => {
  const { character } = useCharacterStore();

  const proficiencyBonus = Math.ceil((character.level || 1) / 4) + 1;

  // Final ability scores including background increments
  const finalAbilities: AbilityScores = { ...character.abilities };
  const assignments = character.backgroundChoices?.abilityAssignments || {};
  
  (Object.keys(character.abilities) as Array<keyof AbilityScores>).forEach(ability => {
    const base = Number(character.abilities[ability] || 10);
    const bonus = Number(assignments[ability] || 0);
    finalAbilities[ability] = base + bonus;
  });

  const modifiers: AbilityScores = {
    str: Math.floor((finalAbilities.str - 10) / 2),
    dex: Math.floor((finalAbilities.dex - 10) / 2),
    con: Math.floor((finalAbilities.con - 10) / 2),
    int: Math.floor((finalAbilities.int - 10) / 2),
    wis: Math.floor((finalAbilities.wis - 10) / 2),
    cha: Math.floor((finalAbilities.cha - 10) / 2),
  };

  const savingThrows: Record<string, number> = {
    str: modifiers.str + (character.savingThrows.includes('str') ? proficiencyBonus : 0),
    dex: modifiers.dex + (character.savingThrows.includes('dex') ? proficiencyBonus : 0),
    con: modifiers.con + (character.savingThrows.includes('con') ? proficiencyBonus : 0),
    int: modifiers.int + (character.savingThrows.includes('int') ? proficiencyBonus : 0),
    wis: modifiers.wis + (character.savingThrows.includes('wis') ? proficiencyBonus : 0),
    cha: modifiers.cha + (character.savingThrows.includes('cha') ? proficiencyBonus : 0),
  };

  const skillAbilityMap: Record<string, keyof AbilityScores> = {
    Athletics: 'str',
    Acrobatics: 'dex',
    'Sleight of Hand': 'dex',
    Stealth: 'dex',
    Arcana: 'int',
    History: 'int',
    Investigation: 'int',
    Nature: 'int',
    Religion: 'int',
    'Animal Handling': 'wis',
    Insight: 'wis',
    Medicine: 'wis',
    Perception: 'wis',
    Survival: 'wis',
    Deception: 'cha',
    Intimidation: 'cha',
    Performance: 'cha',
    Persuasion: 'cha',
  };

  const skillBonuses: Record<string, number> = {};
  Object.keys(skillAbilityMap).forEach((skill) => {
    const ability = skillAbilityMap[skill];
    const isProficient = character.skillProficiencies.includes(skill);
    skillBonuses[skill] = modifiers[ability] + (isProficient ? proficiencyBonus : 0);
  });

  const carryingCapacity = (finalAbilities.str || 10) * 15;
  const carriedWeight = 0;

  // Spellcasting metrics
  // Check background spellcasting choice or default to class
  const spellcastingAbility: keyof AbilityScores = character.bgChoices?.spellcastingAbility || 'cha'; 
  const spellAttack = modifiers[spellcastingAbility] + proficiencyBonus;
  const spellSaveDc = 8 + modifiers[spellcastingAbility] + proficiencyBonus;

  return {
    proficiencyBonus,
    finalAbilities,
    modifiers,
    savingThrows,
    skillBonuses,
    initiative: modifiers.dex,
    armorClass: 10 + modifiers.dex,
    maxHp: character.hp || 10,
    spellAttack,
    spellSaveDc,
    encumbrance: {
      carriedWeight,
      carryingCapacity,
      encumbered: carriedWeight > carryingCapacity,
    }
  };
};

export const signed = (value: number) => (value >= 0 ? `+${value}` : value);
