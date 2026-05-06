/**
 * Background Parser - Parse raw 5etools background data into structured format
 */

import type {
  RawBackground,
  ParsedBackground,
  ParsedAbility,
  EquipmentOption,
  EquipmentItem,
  AbilityName,
  MagicInitiateInfo,
} from '../../types/background';

type RawEquipmentEntry = string | { item?: string; displayName?: string; special?: string; quantity?: number; value?: number };

function parseAbilityChoices(raw: RawBackground['ability']): ParsedAbility[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw.map((ability) => {
    if (!ability.choose) {
      return { options: [], type: 'choose' as const };
    }

    const choose = ability.choose;
    if (choose.weighted) {
      return {
        options: choose.weighted.from as AbilityName[],
        weights: choose.weighted.weights,
        type: 'weighted' as const,
      };
    }

    return {
      options: (choose.from || []) as AbilityName[],
      type: 'choose' as const,
    };
  });
}

function parseSkillProficiencies(raw: RawBackground['skillProficiencies']): string[] {
  if (!raw) return [];

  return raw.flatMap((group) => {
    if (typeof group === 'object' && group !== null) {
      return Object.keys(group).filter((key) => group[key] === true);
    }
    return [];
  });
}

function parseToolProficiencies(raw: RawBackground['toolProficiencies']): string[] {
  if (!raw) return [];

  return raw.flatMap((group) => {
    if (typeof group === 'object' && group !== null) {
      return Object.keys(group).filter((key) => group[key] === true);
    }
    return [];
  });
}

function parseLanguages(raw: RawBackground['languageProficiencies']): number | string[] {
  if (!raw) return 0;

  const anyStandard = raw.find(
    (lang) => typeof lang === 'object' && lang !== null && 'anyStandard' in lang
  );
  if (anyStandard && typeof anyStandard === 'object' && 'anyStandard' in anyStandard) {
    return (anyStandard as { anyStandard: number }).anyStandard;
  }

  return raw.filter((lang) => typeof lang === 'string') as string[];
}

function parseEquipmentItem(entry: RawEquipmentEntry): EquipmentItem | null {
  if (typeof entry === 'string') {
    // Handle pipe notation like "book|phb"
    const [name] = entry.split('|');
    return { name: name.trim() };
  }

  if (typeof entry === 'object' && entry !== null) {
    return {
      name: entry.item || entry.special || '',
      displayName: entry.displayName,
      quantity: entry.quantity,
      special: entry.special,
    };
  }

  return null;
}

function parseEquipmentOption(entries: RawEquipmentEntry[]): EquipmentOption {
  const items: EquipmentItem[] = [];
  let goldValue: number | undefined;

  for (const entry of entries) {
    if (typeof entry === 'string') continue; // Skip empty strings

    if (typeof entry === 'object' && entry !== null && 'value' in entry) {
      goldValue = (entry as { value: number }).value;
    } else {
      const item = parseEquipmentItem(entry);
      if (item && item.name) items.push(item);
    }
  }

  // Determine type based on content
  if (items.length > 0 && goldValue !== undefined) {
    return { type: 'mixed', items, goldValue };
  }
  if (goldValue !== undefined) {
    return { type: 'gold', goldValue };
  }
  return { type: 'items', items };
}

function parseEquipment(
  raw: RawBackground['startingEquipment']
): { optionA: EquipmentOption; optionB: EquipmentOption } {
  if (!raw || !Array.isArray(raw)) {
    return { optionA: { type: 'items', items: [] }, optionB: { type: 'items', items: [] } };
  }

  let optionAEntries: RawEquipmentEntry[] = [];
  let optionBEntries: RawEquipmentEntry[] = [];

  for (const group of raw) {
    if ('A' in group) optionAEntries = group.A as RawEquipmentEntry[];
    if ('B' in group) optionBEntries = group.B as RawEquipmentEntry[];
  }

  return {
    optionA: parseEquipmentOption(optionAEntries),
    optionB: parseEquipmentOption(optionBEntries),
  };
}

function parseMagicInitiateFeat(raw: RawBackground['feats']): MagicInitiateInfo | null {
  if (!raw || !Array.isArray(raw)) return null;

  for (const group of raw) {
    for (const key of Object.keys(group)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.includes('magic initiate')) {
        // Extract class from patterns like "magic initiate; cleric|xphb"
        const match = key.match(/magic initiate;?\s*(\w+)/i);
        if (match) {
          const sourceMatch = key.match(/\|(\w+)$/i);
          return {
            className: match[1],
            source: sourceMatch ? sourceMatch[1].toUpperCase() : 'XPHB',
          };
        }
      }
    }
  }

  return null;
}

/**
 * Parse a raw 5etools background into a structured ParsedBackground.
 */
export function parseBackground(raw: RawBackground): ParsedBackground {
  return {
    name: raw.name,
    source: raw.source,
    page: raw.page,
    abilityScores: parseAbilityChoices(raw.ability),
    skillProficiencies: parseSkillProficiencies(raw.skillProficiencies),
    toolProficiencies: parseToolProficiencies(raw.toolProficiencies),
    languages: parseLanguages(raw.languageProficiencies),
    equipment: parseEquipment(raw.startingEquipment),
    feat: raw.feats ? raw.feats.flatMap((g) => Object.keys(g)).join(', ') : null,
    magicInitiate: parseMagicInitiateFeat(raw.feats),
  };
}

/**
 * Parse all backgrounds from raw data.
 */
export function parseAllBackgrounds(rawData: RawBackground[]): ParsedBackground[] {
  return rawData.map(parseBackground);
}