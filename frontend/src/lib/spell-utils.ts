export type CasterType = 'full' | 'half' | 'third' | 'pact' | 'none';

const FULL_CASTER_TABLE = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], 
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]
];

export const getClassCasterType = (className: string): CasterType => {
  const name = className.toLowerCase();
  if (['wizard', 'sorcerer', 'bard', 'cleric', 'druid'].includes(name)) return 'full';
  if (['paladin', 'ranger'].includes(name)) return 'half';
  if (['warlock'].includes(name)) return 'pact';
  return 'none';
};

export const calculateMaxSlots = (className: string, level: number): Record<string, number> => {
  const type = getClassCasterType(className);
  if (type === 'none') return {};
  
  if (type === 'full') {
    const row = FULL_CASTER_TABLE[Math.min(level - 1, 19)];
    return Object.fromEntries(row.map((count, i) => [String(i + 1), count]));
  }
  
  // Warlock Pact Magic (Simplified for now)
  if (type === 'pact') {
    const slotLevel = Math.min(Math.ceil(level / 2), 5);
    const count = level >= 17 ? 4 : (level >= 11 ? 3 : 2);
    return { [String(slotLevel)]: count };
  }

  // Half casters (Paladin, Ranger) - starts at level 2
  if (type === 'half' && level >= 2) {
    const row = FULL_CASTER_TABLE[Math.min(Math.floor(level / 2) - 1, 19)];
    return Object.fromEntries(row.map((count, i) => [String(i + 1), count]));
  }

  return {};
};

export const getSpellOrigin = (spell: any, character: any): string => {
  if (!spell) return '';

  const originKind = spell.originKind || spell.source; // Fallback to source for backward compatibility
  
  if (originKind === 'background' || originKind === 'bg-feat') {
    const bgName = character.background || 'Background';
    const subOrigin = spell.originName || '';
    return `Feat: ${bgName} Magic Initiate${subOrigin ? ` (${subOrigin})` : ''}`;
  }

  if (originKind === 'feature' || originKind === 'feat-auto') {
    const featName = spell.originName;
    const abilityKey = character.bgChoices?.spellcastingAbility || '';
    
    // Check if the character class matches the ability (heuristic for druid, wizard, etc.)
    const charClass = (character.class || '').toLowerCase();
    
    const isWisClass = (charClass === 'druid' || charClass === 'cleric');
    const isIntClass = (charClass === 'wizard');
    const isChaClass = (charClass === 'sorcerer' || charClass === 'bard' || charClass === 'warlock' || charClass === 'paladin');

    if (abilityKey === 'wis' && isWisClass) return character.class;
    if (abilityKey === 'int' && isIntClass) return character.class;
    if (abilityKey === 'cha' && isChaClass) return character.class;

    // Fallback to the feature name, or the class name if the feature name is missing
    return featName || character.class || 'Classe';
  }

  if (originKind === 'class') {
    return character.class || 'Classe';
  }

  // If no explicit originKind, but it's not a special source, assume it's a class spell
  if (!originKind || originKind === 'XPHB' || originKind === 'PHB') {
    return character.class || 'Classe';
  }

  return originKind;
};
