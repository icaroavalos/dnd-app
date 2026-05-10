import type { Character, ApiState } from '../../types/state.js';
import type { SpellEntry } from './spell-engine-types.js';
import { classHasSpellList, classSpellAbility } from './spell-engine-class.js';
import { backgroundSpellAbility, selectedBackgroundSpells } from './spell-engine-background.js';
import { autoGrantedSpellEntries } from './spell-engine-utilities.js';
import { backgroundSpellResourceId } from './spell-engine-utilities.js';

export function currentKnownSpellNames(
  character: Character,
  api: ApiState,
  activeFeatures: any[] = []
): string[] {
  return currentSpellEntries(character, api, activeFeatures).map((spell) => spell.name);
}

export function currentSpellEntries(
  character: Character,
  api: ApiState,
  activeFeatures: any[] = []
): SpellEntry[] {
  const entries = new Map<string, SpellEntry>();
  const explicit = [...new Set(character.spells ?? [])];
  const autoGranted = autoGrantedSpellEntries(character, api, activeFeatures);
  const backgroundSelected = selectedBackgroundSpells(character, api);
  const detailLookup = api.source?.spellDetails ?? {};
  const classSpellcasting = classHasSpellList(character.class, api);

  explicit.forEach((name) => {
    const detail = detailLookup[String(name).toLowerCase()];
    const level = Number(detail?.level) || 0;
    entries.set(name, {
      name,
      level,
      origin: 'class',
      castMode: level === 0 ? 'at-will' : 'slots',
      slotLevel: level > 0 ? level : null,
    });
  });

  autoGranted.forEach((spell) => {
    if (entries.has(spell.name)) return;
    entries.set(spell.name, {
      name: spell.name,
      level: Number(spell.level) || 0,
      origin: 'auto',
      castMode: Number(spell.level) > 0 && classSpellcasting ? 'slots' : 'at-will',
      slotLevel: Number(spell.level) > 0 && classSpellcasting ? Number(spell.level) : null,
      sourceLabel: spell.origin,
    });
  });

  backgroundSelected.forEach((spell) => {
    if (entries.has(spell.name)) return;
    const resourceId = spell.level > 0 ? backgroundSpellResourceId(spell.name) : undefined;
    entries.set(spell.name, {
      name: spell.name,
      level: spell.level,
      origin: 'background',
      castMode: spell.level === 0 ? 'at-will' : 'resource',
      slotLevel: null,
      resourceId,
      sourceLabel: spell.ruleName,
    });
  });

  return [...entries.values()];
}

export function spellAbility(character: Character, api: ApiState): string {
  if (classHasSpellList(character.class, api)) {
    return classSpellAbility(character.class, api);
  }
  return backgroundSpellAbility(character, api) ?? classSpellAbility(character.class, api);
}

export function spellAbilityForSpell(
  spellName: string,
  character: Character,
  api: ApiState,
  bgSpellNames: string[]
): string {
  const bgAbility = backgroundSpellAbility(character, api);
  if (bgAbility && bgSpellNames.includes(spellName)) return bgAbility;
  return classHasSpellList(character.class, api)
    ? classSpellAbility(character.class, api)
    : bgAbility ?? classSpellAbility(character.class, api);
}
