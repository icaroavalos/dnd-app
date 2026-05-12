import type { Character, ApiState } from '../../types/state.js';
import {
  getSelectedBackgroundSpellNames,
  resolveBackgroundSpellcastingAbility,
  createBackgroundSpellRules,
  getBackgroundGrantedSpells,
  getBackgroundSpellOptions,
} from '../../lib/magic-initiate-validator.js';
import type { SpellResourceDefinition } from './spell-engine-types.js';
import { backgroundSpellResourceId as backgroundSpellResourceIdHelper } from './spell-engine-utilities.js';

interface BackgroundSelectedSpell {
  name: string;
  level: number;
  ruleName: string;
}

export function backgroundSpellChoiceRules(character: Character, api: ApiState) {
  if (!api) return [];
  const background = character.background || character.bgChoices?.background;
  const grants = getBackgroundGrantedSpells(background || undefined, api.source?.backgroundDetails);
  return createBackgroundSpellRules(grants);
}

export function backgroundSpellAbility(character: Character, api: ApiState): string | null {
  if (!api) return null;
  const rules = backgroundSpellChoiceRules(character, api);
  return resolveBackgroundSpellcastingAbility(character.bgChoices, rules);
}

export function selectedBackgroundSpells(character: Character, api: ApiState): BackgroundSelectedSpell[] {
  if (!api) return [];
  const rules = backgroundSpellChoiceRules(character, api);
  if (!rules.length) return [];

  return rules.flatMap((rule) => {
    const selected = character.bgSpellChoices?.[rule.id] ?? [];
    const options = getBackgroundSpellOptions(rule.spellList, api.classSpells ?? {});
    const optionByName = new Map(options.map((spell) => [spell.name.toLowerCase(), spell]));
    const spellDetails = api.source?.spellDetails ?? {};

    return selected
      .map((name) => {
        const detail =
          optionByName.get(String(name).toLowerCase()) ??
          spellDetails[String(name).toLowerCase()] ??
          null;
        if (!detail) return null;
        return {
          name: detail.name,
          level: Number(detail.level) || 0,
          ruleName: rule.name,
        };
      })
      .filter((spell): spell is BackgroundSelectedSpell => Boolean(spell));
  });
}

export function backgroundSpellResourceDefinitions(
  character: Character,
  api: ApiState
): SpellResourceDefinition[] {
  return selectedBackgroundSpells(character, api)
    .filter((spell) => spell.level > 0)
    .map((spell) => ({
      id: backgroundSpellResourceIdHelper(spell.name),
      name: spell.name,
      kind: 'spell',
      sourceLabel: spell.ruleName,
      body: `Cast ${spell.name} once without using a class spell slot. You regain the ability to cast it this way when you finish a Long Rest.`,
      level: spell.level,
      max: 1,
      recovery: { long: 'all' as const },
      actionKind: 'action',
    }));
}
