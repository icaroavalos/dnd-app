import { useCharacterStore } from '../store/useCharacterStore';
import type { AbilityScores } from '../types/character';
import { calculateMaxSlots } from '../lib/spell-utils';

export const useDerivedState = () => {
  const { character } = useCharacterStore();

  const proficiencyBonus = Math.ceil(character.level / 4) + 1;
  const spellSlotsMax = calculateMaxSlots(character.class, character.level);

  // Final ability scores including background increments and ASI choices
  const finalAbilities: AbilityScores = { ...character.abilities };
  const assignments = character.backgroundChoices?.abilityAssignments || {};
  
  (Object.keys(character.abilities) as Array<keyof AbilityScores>).forEach(ability => {
    const base = Number(character.abilities[ability] ?? 10);
    const backgroundBonus = Number(assignments[ability] || 0);
    
    // Sum ASI choices from all levels
    const asiBonus = Object.values(character.asiChoices || {}).reduce((total, choice: any) => {
      return total + (Number(choice[ability]) || 0);
    }, 0);

    finalAbilities[ability] = base + backgroundBonus + asiBonus;
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
  
  const itemsCatalog = useCharacterStore.getState().itemsCatalog || [];
  const itemMap: Record<string, any> = {};
  itemsCatalog.forEach(item => {
    if (item.id) itemMap[item.id.toLowerCase()] = item;
    itemMap[item.name.toLowerCase()] = item;
  });

  const carriedWeight = (character.inventory || []).reduce((total, item) => {
    const itemId = typeof item === 'string' ? item : (item.baseItemId || '');
    const catalogItem = itemMap[itemId.toLowerCase()];
    
    const weight = Number(item.weight || catalogItem?.weight || 0);
    const qty = Number(item.quantity || 1);
    return total + (weight * qty);
  }, 0);

  // Spellcasting metrics
  // Check background spellcasting choice or default to class
  const spellcastingAbility: keyof AbilityScores = character.bgChoices?.spellcastingAbility || 'cha'; 
  const spellAttack = modifiers[spellcastingAbility] + proficiencyBonus;
  const spellSaveDc = 8 + modifiers[spellcastingAbility] + proficiencyBonus;

  // Armor Class Calculation
  const getArmorClass = () => {
    const inv = character.inventory || [];
    const equippedArmor = inv.find(i => i.status === 'equipped_armor');
    const equippedShield = inv.find(i => i.status === 'equipped_shield');

    let baseAc = 10 + modifiers.dex;
    let shieldBonus = 0;

    if (equippedArmor) {
      const ac = Number(equippedArmor.ac || equippedArmor.armorClass || 10);
      const type = String(equippedArmor.type || '').split('|')[0];
      
      if (type === 'LA') { // Light Armor
        baseAc = ac + modifiers.dex;
      } else if (type === 'MA') { // Medium Armor
        baseAc = ac + Math.min(modifiers.dex, 2);
      } else if (type === 'HA') { // Heavy Armor
        baseAc = ac;
      } else {
        baseAc = ac + modifiers.dex;
      }
    }

    if (equippedShield) {
      shieldBonus = Number(equippedShield.ac || equippedShield.armorClass || 2);
    }

    return baseAc + shieldBonus;
  };

  return {
    proficiencyBonus,
    finalAbilities,
    modifiers,
    savingThrows,
    skillBonuses,
    initiative: modifiers.dex,
    armorClass: getArmorClass(),
    maxHp: character.maxHp || 10,
    spellAttack,
    spellSaveDc,
    spellSlotsMax,
    encumbrance: {
      carriedWeight,
      carryingCapacity,
      encumbered: carriedWeight > carryingCapacity,
    }
  };
};

export const signed = (value: number) => (value >= 0 ? `+${value}` : value);
