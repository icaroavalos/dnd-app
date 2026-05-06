/**
 * Background Rules - Generate choice rules for UI from parsed backgrounds
 */

import { getBackground } from './background-loader';
import { parseBackground } from './background-parser';
import type { ParsedBackground, BackgroundRule, BackgroundRuleOption, AbilityName } from '../../types/background';

/**
 * Format ability score name for display
 */
function formatAbilityName(ability: string): string {
  const names: Record<string, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  };
  return names[ability.toLowerCase()] || ability;
}

/**
 * Format skill name for display (Title Case)
 */
function formatSkillName(skill: string): string {
  return skill
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format tool name for display (Title Case)
 */
function formatToolName(tool: string): string {
  return tool
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Build ability score rule from parsed background
 */
function buildAbilityRule(background: ParsedBackground): BackgroundRule | null {
  if (!background.abilityScores.length) return null;

  const firstAbility = background.abilityScores[0];
  const weights = firstAbility.weights;
  const options: BackgroundRuleOption[] = [];

  // Build options from ability choices
  background.abilityScores.forEach((ability, index) => {
    ability.options.forEach((opt) => {
      const weight = weights?.[index];
      const existing = options.find((o) => o.value === opt);

      if (existing && weight !== undefined) {
        // Merge weights (add them)
        const existingWeight = parseInt(existing.hint?.match(/\d+/)?.[0] || '0');
        existing.hint = `weight: ${existingWeight + weight}`;
      } else {
        options.push({
          value: opt,
          label: formatAbilityName(opt),
          hint: weight !== undefined ? `weight: ${weight}` : undefined,
        });
      }
    });
  });

  return {
    id: `bg-${slugify(background.name)}-ability`,
    name: `${background.name}: Ability Scores`,
    type: 'ability',
    summary: 'Choose how to increase your ability scores. Each background provides a suggested distribution.',
    options,
    required: 2, // +2/+1 pattern = 2 distinct scores affected
  };
}

/**
 * Build skill proficiency rule from parsed background
 */
function buildSkillRule(background: ParsedBackground): BackgroundRule | null {
  if (!background.skillProficiencies.length) return null;

  return {
    id: `bg-${slugify(background.name)}-skills`,
    name: `${background.name}: Skills`,
    type: 'skill',
    summary: 'Skill proficiencies granted by this background.',
    options: background.skillProficiencies.map((skill) => ({
      value: skill,
      label: formatSkillName(skill),
    })),
    required: background.skillProficiencies.length,
  };
}

/**
 * Build tool proficiency rule from parsed background
 */
function buildToolRule(background: ParsedBackground): BackgroundRule | null {
  if (!background.toolProficiencies.length) return null;

  return {
    id: `bg-${slugify(background.name)}-tools`,
    name: `${background.name}: Tools`,
    type: 'tool',
    summary: 'Tool proficiencies granted by this background.',
    options: background.toolProficiencies.map((tool) => ({
      value: tool,
      label: formatToolName(tool),
    })),
    required: background.toolProficiencies.length,
  };
}

/**
 * Format equipment option for display
 */
function formatEquipmentOption(option: { type: string; items?: { name: string; displayName?: string; quantity?: number }[]; goldValue?: number }): string {
  if (option.type === 'gold' || option.type === 'mixed') {
    const gp = Math.floor((option.goldValue || 0) / 100);
    const itemsText = option.items && option.items.length > 0
      ? option.items.map((i) => `${i.quantity ? i.quantity + 'x ' : ''}${i.displayName || i.name}`).join(', ')
      : '';
    return itemsText ? `${itemsText}, ${gp} GP` : `${gp} GP`;
  }
  if (option.items?.length) {
    return option.items
      .map((item) => `${item.quantity ? item.quantity + 'x ' : ''}${item.displayName || item.name}`)
      .join(', ');
  }
  return 'Empty';
}

/**
 * Build equipment rule from parsed background
 */
function buildEquipmentRule(background: ParsedBackground): BackgroundRule | null {
  const { optionA, optionB } = background.equipment;

  return {
    id: `bg-${slugify(background.name)}-equipment`,
    name: `${background.name}: Equipment`,
    type: 'equipment',
    summary: 'Choose your starting equipment.',
    options: [
      {
        value: 'A',
        label: 'Option A',
        hint: formatEquipmentOption(optionA),
      },
      {
        value: 'B',
        label: 'Option B',
        hint: formatEquipmentOption(optionB),
      },
    ],
    required: 1,
  };
}

/**
 * Generate choice rules for a specific background
 */
export function backgroundChoiceRules(backgroundName: string, source: string = 'XPHB'): BackgroundRule[] {
  const raw = getBackground(backgroundName, source);
  if (!raw) {
    console.warn(`Background not found: ${backgroundName} (${source})`);
    return [];
  }

  const parsed = parseBackground(raw);
  const rules: BackgroundRule[] = [];

  const abilityRule = buildAbilityRule(parsed);
  if (abilityRule) rules.push(abilityRule);

  const skillRule = buildSkillRule(parsed);
  if (skillRule) rules.push(skillRule);

  const toolRule = buildToolRule(parsed);
  if (toolRule) rules.push(toolRule);

  const equipmentRule = buildEquipmentRule(parsed);
  if (equipmentRule) rules.push(equipmentRule);

  return rules;
}

/**
 * Get all backgrounds with their rules (for UI listing)
 */
export async function getAllBackgroundRules(): Promise<
  { name: string; source: string; rules: BackgroundRule[] }[]
> {
  const { loadBackgroundData } = await import('./background-loader');
  const backgrounds = await loadBackgroundData();

  return backgrounds
    .filter((bg) => bg.source === 'XPHB')
    .map((bg) => ({
      name: bg.name,
      source: bg.source,
      rules: backgroundChoiceRules(bg.name, bg.source),
    }));
}

/**
 * Check if background has Magic Initiate feature
 */
export function hasMagicInitiate(backgroundName: string, source: string = 'XPHB'): boolean {
  const raw = getBackground(backgroundName, source);
  if (!raw) return false;

  const parsed = parseBackground(raw);
  return parsed.magicInitiate !== null;
}

/**
 * Get Magic Initiate class for a background
 */
export function getMagicInitiateClass(backgroundName: string, source: string = 'XPHB'): string | null {
  const raw = getBackground(backgroundName, source);
  if (!raw) return null;

  const parsed = parseBackground(raw);
  return parsed.magicInitiate?.className || null;
}

/**
 * Simple slugify for IDs
 */
function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}