import { useCharacterStore } from '../store/useCharacterStore';
import type { AbilityScores } from '../types/character';

export const useDerivedState = () => {
  const { character } = useCharacterStore();

  const proficiencyBonus = Math.ceil((character.level || 1) / 4) + 1;

  const modifiers: AbilityScores = {
    str: Math.floor((character.abilities.str - 10) / 2),
    dex: Math.floor((character.abilities.dex - 10) / 2),
    con: Math.floor((character.abilities.con - 10) / 2),
    int: Math.floor((character.abilities.int - 10) / 2),
    wis: Math.floor((character.abilities.wis - 10) / 2),
    cha: Math.floor((character.abilities.cha - 10) / 2),
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

  const carryingCapacity = character.abilities.str * 15;
  const carriedWeight = 0;

  // Spellcasting metrics (Assuming Charisma for now, should be dynamic based on class)
  const spellcastingAbility: keyof AbilityScores = 'cha'; 
  const spellAttack = modifiers[spellcastingAbility] + proficiencyBonus;
  const spellSaveDc = 8 + modifiers[spellcastingAbility] + proficiencyBonus;

  return {
    proficiencyBonus,
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
