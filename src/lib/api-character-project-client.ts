/**
 * API Client para consumir POST /characters/project do backend.
 *
 * Este endpoint projeta um personagem (calcula derivados) sem persistir.
 * Útil para preview em tempo real da ficha.
 */

import { getBaseUrl } from './api-catalog-client.js';

export interface ProjectedCharacter {
  ruleset: string;
  level: number;
  proficiencyBonus: number;
  abilityScores: Record<string, number>;
  abilityModifiers: Record<string, number>;
  savingThrows: Record<string, number>;
  skillBonuses: Record<string, number>;
  armorClass: number;
  initiative: number;
  speed: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  passivePerception: number;
  spellcasting: {
    ability: string;
    attackBonus: number;
    saveDc: number;
  } | null;
  spellSlotsMax: Record<string, number>;
  resources: Record<string, any>;
}

export interface CharacterRecord {
  id?: string;
  ruleset: string;
  name: string;
  lineageId: string;
  backgroundId: string;
  alignment: string;
  experience: number;
  classes: Array<{ classId: string; level: number }>;
  abilities: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skillProficiencies: string[];
  savingThrowProficiencies: string[];
  inventory: any[];
  spellChoices: any[];
  resources: Record<string, any>;
  state: {
    hp: number;
    maxHpOverride: number | null;
    tempHp: number;
    hitDiceUsed: number;
    spellSlotsUsed: Record<string, number>;
    activeConditions: string[];
  };
  backgroundChoices?: any[];
}

/**
 * Projeta um personagem (calcula derivados) sem persistir.
 * Usa POST /characters/project do backend.
 */
export async function projectCharacter(
  character: CharacterRecord
): Promise<ProjectedCharacter> {
  const response = await fetch(`${getBaseUrl()}/characters/project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(character),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to project character: ${response.statusText} - ${error}`);
  }

  return response.json();
}

/**
 * Debounced projection - espera um delay antes de projetar.
 * Útil para evitar chamadas excessivas durante digitação.
 */
export function createDebouncedProjector(delayMs = 300) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCall: any = null;

  const debounced = async (
    character: CharacterRecord,
    callback: (result: ProjectedCharacter | Error) => void
  ) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    lastCall = character;

    timeoutId = setTimeout(async () => {
      try {
        const result = await projectCharacter(character);
        callback(result);
      } catch (err) {
        callback(err as Error);
      }
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

export type DebouncedProjector = ReturnType<typeof createDebouncedProjector>;
