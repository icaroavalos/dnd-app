import { useCharacterStore } from '../store/useCharacterStore';
import type { AbilityScores } from '../types/character';
import { calculateMaxSlots } from '../lib/spell-utils';

export const useDerivedState = () => {
  const { character } = useCharacterStore();

  const proficiencyBonus = Math.ceil(character.level / 4) + 1;
  const spellSlotsMax = calculateMaxSlots(character.class, character.level);
  const charClass = (character.class || '').toLowerCase();
  const effectiveSavingThrows = character.savingThrows.length > 0
    ? character.savingThrows
    : DEFAULT_CLASS_SAVES[charClass] || [];

  // Final ability scores including background increments and ASI choices
  const finalAbilities: AbilityScores = { ...character.abilities };
  const assignments = character.backgroundChoices?.abilityAssignments || {};
  
  (Object.keys(character.abilities) as Array<keyof AbilityScores>).forEach(ability => {
    const base = Number(character.abilities[ability] ?? 10);
    const backgroundBonus = Number(assignments[ability] || 0);
    
    // Sum ASI choices from all levels
    const asiBonus = Object.values(character.asiChoices || {}).reduce((total, choice: any) => {
      const val = Number(choice?.[ability] || 0);
      return total + (isNaN(val) ? 0 : val);
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
    str: modifiers.str + (effectiveSavingThrows.includes('str') ? proficiencyBonus : 0),
    dex: modifiers.dex + (effectiveSavingThrows.includes('dex') ? proficiencyBonus : 0),
    con: modifiers.con + (effectiveSavingThrows.includes('con') ? proficiencyBonus : 0),
    int: modifiers.int + (effectiveSavingThrows.includes('int') ? proficiencyBonus : 0),
    wis: modifiers.wis + (effectiveSavingThrows.includes('wis') ? proficiencyBonus : 0),
    cha: modifiers.cha + (effectiveSavingThrows.includes('cha') ? proficiencyBonus : 0),
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
  const spellcastingMetrics = {
    int: { attack: modifiers.int + proficiencyBonus, dc: 8 + modifiers.int + proficiencyBonus },
    wis: { attack: modifiers.wis + proficiencyBonus, dc: 8 + modifiers.wis + proficiencyBonus },
    cha: { attack: modifiers.cha + proficiencyBonus, dc: 8 + modifiers.cha + proficiencyBonus },
  };

  // Determine main class spellcasting ability
  let mainSpellcastingAbility: 'int' | 'wis' | 'cha' = 'cha';
  if (['wizard', 'artificer', 'rogue', 'fighter'].includes(charClass)) mainSpellcastingAbility = 'int';
  if (['cleric', 'druid', 'ranger', 'monk'].includes(charClass)) mainSpellcastingAbility = 'wis';
  if (['bard', 'paladin', 'sorcerer', 'warlock'].includes(charClass)) mainSpellcastingAbility = 'cha';

  // Armor Class Calculation
  const getArmorClassOptions = () => {
    const inv = character.inventory || [];
    const equippedArmor = inv.find(i => i.status === 'equipped_armor');
    const equippedShield = inv.find(i => i.status === 'equipped_shield');

    let shieldBonus = 0;
    if (equippedShield) {
      shieldBonus = Number(equippedShield.ac || equippedShield.armorClass || 2);
    }

    const options = [];

    // Standard calculation (Armor or 10+Dex)
    let baseAc = 10 + modifiers.dex;
    if (equippedArmor) {
      const ac = Number(equippedArmor.ac || equippedArmor.armorClass || 10);
      const type = String(equippedArmor.type || '').split('|')[0];
      if (type === 'LA') baseAc = ac + modifiers.dex;
      else if (type === 'MA') baseAc = ac + Math.min(modifiers.dex, 2);
      else if (type === 'HA') baseAc = ac;
      else baseAc = ac + modifiers.dex;
    }

    options.push({
      id: 'standard',
      name: equippedArmor ? `Armadura (${equippedArmor.customName || equippedArmor.name})` : 'Padrão (10 + Destreza)',
      value: baseAc + shieldBonus,
      description: equippedArmor 
        ? `Base ${equippedArmor.ac || equippedArmor.armorClass} + Destreza (limite conforme tipo) + Escudo (${shieldBonus})`
        : `10 + Destreza (${modifiers.dex}) + Escudo (${shieldBonus})`
    });

    // Unarmored Defense (Monk)
    const hasMonk = (character.features || []).some(f => (f.name || '').toLowerCase().includes('unarmored defense') && (f.description || '').toLowerCase().includes('wisdom'));
    if (hasMonk && !equippedArmor && !equippedShield) {
      options.push({
        id: 'unarmored_monk',
        name: 'Defesa Sem Armadura (Monge)',
        value: 10 + modifiers.dex + modifiers.wis,
        description: `10 + Destreza (${modifiers.dex}) + Sabedoria (${modifiers.wis})`
      });
    }

    // Unarmored Defense (Barbarian)
    const hasBarb = (character.features || []).some(f => (f.name || '').toLowerCase().includes('unarmored defense') && (f.description || '').toLowerCase().includes('constitution'));
    if (hasBarb && !equippedArmor) {
      options.push({
        id: 'unarmored_barbarian',
        name: 'Defesa Sem Armadura (Bárbaro)',
        value: 10 + modifiers.dex + modifiers.con + shieldBonus,
        description: `10 + Destreza (${modifiers.dex}) + Constituição (${modifiers.con}) + Escudo (${shieldBonus})`
      });
    }

    // Natural Armor
    const naturalArmor = (character.features || []).find(f => (f.name || '').toLowerCase().includes('natural armor'));
    if (naturalArmor) {
      const desc = (naturalArmor.description || '').toLowerCase();
      const baseNatural = desc.match(/(\d+)\s*\+\s*your\s*dexterity/);
      const fixedNatural = desc.match(/armor\s*class\s*is\s*(\d+)/);
      if (baseNatural) {
        const val = parseInt(baseNatural[1]);
        options.push({ id: 'natural_armor', name: 'Armadura Natural', value: val + modifiers.dex + shieldBonus, description: `${val} + Destreza (${modifiers.dex}) + Escudo (${shieldBonus})` });
      } else if (fixedNatural) {
        const val = parseInt(fixedNatural[1]);
        options.push({ id: 'natural_armor', name: 'Armadura Natural', value: val + shieldBonus, description: `${val} (Fixo) + Escudo (${shieldBonus})` });
      }
    }

    return options;
  };

  const armorClassOptions = getArmorClassOptions();
  const selectedAcFormula = character.acFormulaId || 'standard';
  const finalArmorClass = armorClassOptions.find(o => o.id === selectedAcFormula)?.value || armorClassOptions[0]?.value || 10;

  const getProficiencyWarnings = () => {
    const inv = character.inventory || [];
    const equippedArmor = inv.find(i => i.status === 'equipped_armor');
    const equippedShield = inv.find(i => i.status === 'equipped_shield');
    const warnings: string[] = [];

    const features = character.features || [];
    const profText = features.map(f => (f.name + ' ' + f.description).toLowerCase()).join(' ');
    
    const hasLight = profText.includes('light armor');
    const hasMedium = profText.includes('medium armor');
    const hasHeavy = profText.includes('heavy armor');
    const hasShield = profText.includes('shield');

    if (equippedArmor) {
      const type = String(equippedArmor.type || '').split('|')[0];
      if (type === 'LA' && !hasLight) warnings.push('Armadura Leve');
      if (type === 'MA' && !hasMedium) warnings.push('Armadura Média');
      if (type === 'HA' && !hasHeavy) warnings.push('Armadura Pesada');
    }

    if (equippedShield && !hasShield) warnings.push('Escudo');

    return warnings;
  };

  return {
    proficiencyBonus,
    finalAbilities,
    modifiers,
    savingThrows,
    savingThrowProficiencies: effectiveSavingThrows,
    skillBonuses,
    initiative: modifiers.dex,
    armorClass: finalArmorClass,
    armorClassOptions,
    proficiencyWarnings: getProficiencyWarnings(),
    maxHp: character.maxHp || 10,
    spellAttack: spellcastingMetrics[mainSpellcastingAbility].attack,
    spellSaveDc: spellcastingMetrics[mainSpellcastingAbility].dc,
    spellcastingMetrics,
    mainSpellcastingAbility,
    spellSlotsMax,
    encumbrance: {
      carriedWeight,
      carryingCapacity,
      encumbered: carriedWeight > carryingCapacity,
    }
  };
};

export const signed = (value: number) => (value >= 0 ? `+${value}` : value);

const DEFAULT_CLASS_SAVES: Record<string, string[]> = {
  barbarian: ['str', 'con'],
  bard: ['dex', 'cha'],
  cleric: ['wis', 'cha'],
  druid: ['int', 'wis'],
  fighter: ['str', 'con'],
  monk: ['str', 'dex'],
  paladin: ['wis', 'cha'],
  ranger: ['str', 'dex'],
  rogue: ['dex', 'int'],
  sorcerer: ['con', 'cha'],
  warlock: ['wis', 'cha'],
  wizard: ['int', 'wis'],
  artificer: ['con', 'int'],
};
