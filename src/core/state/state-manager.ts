/**
 * Gerenciamento de estado e persistência
 *
 * Funções puras para load/save do estado da aplicação
 */

import type { AppState, Character } from '../../types/state.js';
import { getDefaultBackgroundChoice } from '../../types/background.js';

const STATE_KEY = 'dnd-character-state';

/**
 * Carrega estado do localStorage ou retorna estado vazio
 */
export function loadState(): Partial<AppState> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }

  return {};
}

/**
 * Salva estado no localStorage
 */
export function saveState(state: Partial<AppState>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

/**
 * Cria um novo character com valores padrão
 */
export function createDefaultCharacter(): Character {
  return {
    name: '',
    class: '',
    level: 1,
    race: '',
    subrace: '',
    background: '',
    alignment: 'Neutral',
    experience: 0,
    abilityMethod: 'standard',
    classFeatureChoices: {},
    asiChoices: {},
    equipmentChoices: {},
    inventory: [],
    equippedItems: [],
    hitDiceUsed: 0,
    spellSlots: {},
    resources: {},
    tempHp: 0,
    creationComplete: false,
    hp: 0,
    armorClass: 10,
    speed: 30,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: [],
    classSkillChoices: [],
    skillProficiencies: [],
    attacks: [],
    spells: [],
    notes: '',
    bgSpellChoices: {},
    bgChoices: getDefaultBackgroundChoice(),
  };
}

/**
 * Valida se um character está completo
 */
export function isCharacterComplete(character: Character): boolean {
  return (
    character.name.trim().length > 0 &&
    character.class.length > 0 &&
    character.race.length > 0 &&
    character.background.length > 0
  );
}

/**
 * Cria um novo estado vazio
 */
export function createEmptyState(): Partial<AppState> {
  return {
    step: 'lineage',
    tab: 'summary',
    dataStatus: 'local',
    derived: null,
    selectedSpell: '',
    actionFilter: 'all',
    selectedAction: '',
    featureFilter: 'all',
    selectedFeature: '',
    bgSpellChoices: {},
    hpModalOpen: false,
    hpModalMode: 'damage',
    hpModalAmount: 0,
    restModalOpen: false,
    restModalType: null,
    restModalContent: null,
    validationMessage: '',
    builderVisible: true,
    levelUpMode: false,
    levelUpFrom: 1,
    levelUpHpBase: 0,
    levelUpHpGain: 0,
    levelUpSnapshot: null,
    levelUpClassMode: 'same',
    activeCharacterId: 'default',
    characters: [],
    api: {
      classes: {},
      levels: {},
      races: {},
      spells: [],
      classSpells: {},
      spellDetails: {},
      source: {
        classOptions: [],
        raceOptions: [],
        backgroundOptions: [],
        backgroundDetails: {},
        subraceDetails: {},
        itemDetails: {},
        classFeatures: [],
        subclassFeatures: [],
        subclasses: [],
        featDetails: {},
        spellDetails: {},
      },
    },
    character: createDefaultCharacter(),
  };
}
