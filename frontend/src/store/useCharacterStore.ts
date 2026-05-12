import { create } from 'zustand';
import type { Character, AbilityScores as AbilityScoresType } from '../types/character';

interface CharacterState {
  character: Character;
  activeCharacterId: string | null;
  
  // Actions
  setCharacter: (character: Character) => void;
  setActiveCharacterId: (id: string | null) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  updateAbility: (ability: keyof AbilityScoresType, value: number) => void;
  setHp: (hp: number) => void;
  addSpell: (spell: any) => void;
  removeSpell: (spellId: string) => void;
  toggleSkillProficiency: (skill: string) => void;
}

const createDefaultCharacter = (): Character => ({
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
  spellSlots: {
    1: { max: 0, used: 0 },
    2: { max: 0, used: 0 },
    3: { max: 0, used: 0 },
    4: { max: 0, used: 0 },
    5: { max: 0, used: 0 },
    6: { max: 0, used: 0 },
    7: { max: 0, used: 0 },
    8: { max: 0, used: 0 },
    9: { max: 0, used: 0 },
  },
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
  features: [],
  notes: '',
});

export const useCharacterStore = create<CharacterState>((set) => ({
  character: createDefaultCharacter(),
  activeCharacterId: null,

  setCharacter: (character) => set({ character }),
  
  setActiveCharacterId: (id) => set({ activeCharacterId: id }),

  updateCharacter: (updates) => 
    set((state) => ({
      character: { ...state.character, ...updates }
    })),

  updateAbility: (ability, value) =>
    set((state) => ({
      character: {
        ...state.character,
        abilities: {
          ...state.character.abilities,
          [ability]: value
        }
      }
    })),

  setHp: (hp) =>
    set((state) => ({
      character: { ...state.character, hp }
    })),

  addSpell: (spell) =>
    set((state) => ({
      character: {
        ...state.character,
        spells: state.character.spells.some(s => s.id === spell.id) 
          ? state.character.spells 
          : [...state.character.spells, spell]
      }
    })),

  removeSpell: (spellId) =>
    set((state) => ({
      character: {
        ...state.character,
        spells: state.character.spells.filter((s) => s.id !== spellId)
      }
    })),

  toggleSkillProficiency: (skill) =>
    set((state) => {
      const current = state.character.skillProficiencies;
      const next = current.includes(skill)
        ? current.filter((s) => s !== skill)
        : [...current, skill];
      return {
        character: { ...state.character, skillProficiencies: next }
      };
    }),
}));
