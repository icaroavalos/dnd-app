/**
 * Character Projection - Projecao de personagem via backend.
 *
 * Esta e a unica fonte de verdade para projecao canonica.
 * Requer backend disponivel.
 */

import type { Character, DerivedCharacterSheet } from '../../types/state.js';
import { ProjectionOptions } from './local-character-projection.js';

/**
 * Projeta personagem usando backend. Requer backend disponivel.
 * Esta e a funcao principal para projecao da ficha.
 * Lanca erro se backend falhar - sem fallback local.
 */
export async function projectCharacterSheet(
  character: Character,
  options: ProjectionOptions = {}
): Promise<DerivedCharacterSheet> {
  const { projectCharacter } = await import('../../lib/api-character-project-client.js');
  const projected = await projectCharacter(character as any);
  return convertBackendProjection(projected, character, options);
}

/**
 * Converte projecao do backend para formato local DerivedCharacterSheet.
 */
function convertBackendProjection(
  backend: any,
  character: Character,
  options: ProjectionOptions = {}
): DerivedCharacterSheet {
  return {
    level: backend.level,
    proficiencyBonus: backend.proficiencyBonus,
    abilityScores: backend.abilityScores,
    abilityModifiers: backend.abilityModifiers,
    savingThrows: backend.savingThrows,
    skillBonuses: backend.skillBonuses,
    passivePerception: backend.passivePerception,
    armorClass: backend.armorClass,
    initiative: backend.initiative,
    maxHp: backend.maxHp,
    currentHp: backend.currentHp ?? backend.maxHp,
    tempHp: backend.tempHp ?? 0,
    hitDie: options.hitDie ?? 8,
    hitDiceTotal: character.level ?? 1,
    spellAttack: backend.spellcasting?.attackBonus ?? 0,
    spellSaveDc: backend.spellcasting?.saveDc ?? 0,
    spellSlotsMax: backend.spellSlotsMax ?? {},
    encumbrance: {
      carriedWeight: 0,
      carryingCapacity: (backend.abilityScores?.str ?? 10) * 15,
      encumbered: false,
    },
  };
}
