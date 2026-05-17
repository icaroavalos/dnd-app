/**
 * Utility functions to parse and clean 5etools data structures
 */

export const clean5eText = (text: string): string => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/{@(damage|dice|scaledamage|scaledice) ([^}|]+)(?:\|[^}]*)?}/g, '$2')
    // Preserve interactive tags
    .replace(/{@(spell|item|class|creature|feat|condition|action|skill|sense|background) ([^}|]+)(?:\|([^}]*))?}/g, '[[$1:$2|$3]]')
    .replace(/{@variantrule ([^}|]+)(?:\|([^}]*))?}/g, '[[variantrule:$1|$2]]')
    .replace(/{@i ([^}]+)}/g, '*$1*')
    .replace(/{@b ([^}]+)}/g, '**$1**')
    .replace(/{@atk ([^}]+)}/g, '$1')
    .replace(/{@h}/g, 'Hit: ')
    .replace(/{@dc ([^}]+)}/g, 'DC $1')
    .replace(/{@note ([^}]+)}/g, '($1)')
    .replace(/{@(link|url) ([^}|]+)(?:\|[^}]*)?}/g, '$2')
    .replace(/{@book ([^}|]+)(?:\|[^}]*)?}/g, '$2');
};

export const parse5eEntry = (entry: any): string => {
  if (typeof entry === 'string') return clean5eText(entry);
  if (!entry) return '';

  if (Array.isArray(entry)) {
    return entry.map((e: any) => parse5eEntry(e)).join('\n\n');
  }

  if (entry.type === 'entries' && Array.isArray(entry.entries)) {
    const title = entry.name ? `**${entry.name}.** ` : '';
    return title + entry.entries.map((e: any) => parse5eEntry(e)).join('\n');
  }

  if (entry.type === 'list' && Array.isArray(entry.items)) {
    return entry.items.map((item: any) => `• ${parse5eEntry(item)}`).join('\n');
  }

  if (entry.type === 'item') {
    const title = entry.name ? `**${entry.name}.** ` : '';
    const content = entry.entry ? parse5eEntry(entry.entry) : (entry.entries ? parse5eEntry(entry.entries) : '');
    return title + content;
  }
  
  if (entry.entries) {
    const title = entry.name ? `**${entry.name}.** ` : '';
    return title + parse5eEntry(entry.entries);
  }

  return '';
};

/**
 * Recursively find an entry by name in a 5etools entries structure
 */
export const findEntryByName = (entries: any, name: string): any => {
  if (!entries) return null;
  
  if (Array.isArray(entries)) {
    for (const e of entries) {
      const found = findEntryByName(e, name);
      if (found) return found;
    }
    return null;
  }

  if (entries.name && entries.name.toLowerCase().includes(name.toLowerCase())) {
    return entries;
  }

  if (entries.entries) {
    return findEntryByName(entries.entries, name);
  }

  if (entries.items) {
    return findEntryByName(entries.items, name);
  }

  return null;
};
/**
 * Automagically detect resource usage and recovery from 5e text
 */
export const parseResourceInfo = (text: string, character: any, derived: any): any => {
  if (!text) return null;

  // Clean tags for better matching. 
  // Tags are in format [[type:Value|...]]
  // We want the primary Value (the first part after the colon).
  const clean = text.toLowerCase()
    .replace(/\[\[[^:|]+\:([^|\]]+)(?:\|[^\]]*)?\]\]/g, '$1'); 
  
  let max = 1;
  let label = "Long Rest";
  let strategy: 'full' | 'inc' = 'full';
  let amount = 1;

  // 1. Detect Max Uses
  if (clean.includes("use this feature once") || clean.includes("once you use this") || clean.includes("uma vez")) {
    max = 1;
  } else if (/use this.* (twice|2 times|duas vezes)/i.test(clean) || /uses of this.* (twice|2 times)/i.test(clean)) {
    max = 2;
  } else if (/use this.* (three|3 times|três vezes)/i.test(clean)) {
    max = 3;
  } else if (clean.includes("proficiency")) {
    max = derived?.proficiencyBonus || 2;
  } else if (clean.includes("modifier") || clean.includes("modificador")) {
    const mods = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'força', 'destreza', 'constituição', 'inteligência', 'sabedoria', 'carisma'];
    const foundMod = mods.find(m => clean.includes(m));
    if (foundMod) {
      const map: Record<string, string> = { 
        strength: 'str', força: 'str', 
        dexterity: 'dex', destreza: 'dex', 
        constitution: 'con', constituição: 'con', 
        intelligence: 'int', inteligência: 'int', 
        wisdom: 'wis', sabedoria: 'wis', 
        charisma: 'cha', carisma: 'cha' 
      };
      const key = map[foundMod] as any;
      max = Math.max(1, derived?.modifiers?.[key] || 1);
    }
  }

  // Level-based scaling (2024 patterns)
  const lvl = character.level || 1;
  
  if (clean.includes("rages column")) {
    max = lvl >= 17 ? 6 : (lvl >= 12 ? 5 : (lvl >= 6 ? 4 : (lvl >= 3 ? 3 : 2)));
  } else if (clean.includes("indomitable")) {
    max = lvl >= 17 ? 3 : (lvl >= 13 ? 2 : 1);
  } else if (clean.includes("five times your paladin level")) {
    max = lvl * 5;
  } else if (clean.includes("channel divinity")) {
    max = lvl >= 11 ? 3 : 2;
  } else if (clean.includes("second wind")) {
    max = lvl >= 10 ? 4 : (lvl >= 4 ? 3 : 2);
  } else if (clean.includes("wild shape")) {
    max = lvl >= 17 ? 4 : 2;
  } else if (clean.includes("focus points")) {
    max = lvl >= 2 ? lvl : 0;
  }

  // 2. Detect Recovery
  // 2024 Rule: Regain ONE use on Short Rest (Rage, Channel Divinity, Second Wind)
  const regainOneShort = /regain one expended use.*short rest/i.test(clean) || 
                         /recupera um uso.*descanso curto/i.test(clean) ||
                         (clean.includes("channel divinity") && clean.includes("short rest"));

  if (regainOneShort) {
    strategy = 'inc';
    amount = 1;
    label = "Long Rest (+1 Short)";
  } else if (clean.includes("short rest") || clean.includes("descanso curto")) {
    strategy = 'full';
    label = "Short Rest";
  } else {
    strategy = 'full';
    label = "Long Rest";
  }

  // If no "use this" mention, it might not be a resource
  const isResource = (clean.includes("use this") || 
                     clean.includes("number of times") || 
                     clean.includes("expended use") || 
                     clean.includes("rages column") ||
                     clean.includes("pool of") ||
                     clean.includes("restore a total number")) && 
                     !clean.includes("primal knowledge");

  if (!isResource) {
    return null;
  }

  return {
    id: 'dynamic-res',
    remaining: max,
    max: max,
    recoveryLabel: label,
    recovery: strategy,
    recoveryAmount: amount
  };
};

export const extractSpells = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/\[\[spell:([^|\]]+)(?:\|[^\]]*)?\]\]/gi);
  if (!matches) return [];
  return matches.map(m => {
    const parts = m.match(/\[\[spell:([^|\]]+)/i);
    return parts ? parts[1] : '';
  }).filter(Boolean);
};

export const parseItemValue = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') {
    // 5etools uses copper pieces (cp) for numeric values
    return value / 100;
  }
  if (typeof value === 'string') {
    const match = value.match(/^([\d.]+)\s*([a-z]+)$/i);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'cp') return num / 100;
      if (unit === 'sp') return num / 10;
      if (unit === 'ep') return num / 2;
      if (unit === 'gp') return num;
      if (unit === 'pp') return num * 10;
    }
  }
  return Number(value) || 0;
};
