import { create } from 'zustand';
import type { Character, AbilityScores as AbilityScoresType, Feature, Choice } from '../types/character';
import { getFeatures, getItems } from '../api/catalog-api';
import { parse5eEntry } from '../lib/data-parser';

interface PendingLevelUp {
  nextLevel: number;
  hpGain: number;
  newFeatures: Feature[];
  choices: Choice[];
  selections: Record<string, string[]>;
}

interface CharacterState {
  character: Character;
  activeCharacterId: string | null;
  pendingLevelUp: PendingLevelUp | null;
  
  // Actions
  setCharacter: (character: Character) => void;
  setActiveCharacterId: (id: string | null) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  updateAbility: (ability: keyof AbilityScoresType, value: number) => void;
  setHp: (hp: number) => void;
  applyDamage: (amount: number) => void;
  applyHealing: (amount: number) => void;
  applyTempHp: (amount: number) => void;
  spendHitDie: (roll: number) => void;
  addSpell: (spell: any) => void;
  removeSpell: (spellId: string) => void;
  toggleSkillProficiency: (skill: string) => void;
  useFeatureResource: (featureId: string) => void;
  setFeaturesByKind: (kind: Feature['kind'], features: Feature[]) => void;
  
  // Level Up Actions
  initiateLevelUp: () => Promise<void>;
  cancelLevelUp: () => void;
  updateLevelUpSelection: (choiceId: string, selection: string[]) => void;
  finalizeLevelUp: () => void;
  
  levelUp: () => Promise<void>; // Legacy/internal
  resetLevel: () => void;
  resolveChoice: (choiceId: string, selection: string[]) => void;
  applyShortRest: () => void;
  applyLongRest: (maxHp: number) => void;
  resetCharacter: () => void;
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
  maxHp: 0,
  armorClass: 10,
  speed: 30,
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  savingThrows: [],
  classSkillChoices: [],
  skillProficiencies: [],
  attacks: [],
  spells: [],
  features: [],
  pendingChoices: [],
  notes: '',
  backgroundChoices: {
    backgroundId: '',
    abilityAssignments: {}
  }
});

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: createDefaultCharacter(),
  activeCharacterId: null,
  pendingLevelUp: null,

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

  applyDamage: (amount) =>
    set((state) => {
      let remainingDamage = amount;
      let currentTempHp = state.character.tempHp || 0;
      let currentHp = state.character.hp || 0;

      if (currentTempHp > 0) {
        const absorbed = Math.min(currentTempHp, remainingDamage);
        currentTempHp -= absorbed;
        remainingDamage -= absorbed;
      }

      currentHp = Math.max(0, currentHp - remainingDamage);

      return {
        character: { ...state.character, hp: currentHp, tempHp: currentTempHp }
      };
    }),

  applyHealing: (amount) =>
    set((state) => {
      const max = state.character.maxHp || 10;
      const nextHp = Math.min(max, (state.character.hp || 0) + amount);
      return {
        character: { ...state.character, hp: nextHp }
      };
    }),

  applyTempHp: (amount) =>
    set((state) => {
      const nextTempHp = Math.max(state.character.tempHp || 0, amount);
      return {
        character: { ...state.character, tempHp: nextTempHp }
      };
    }),

  spendHitDie: (roll) =>
    set((state) => {
      if (state.character.hitDiceUsed >= state.character.level) return state;
      
      const max = state.character.maxHp || 10;
      const nextHp = Math.min(max, (state.character.hp || 0) + roll);
      
      return {
        character: { 
          ...state.character, 
          hp: nextHp, 
          hitDiceUsed: state.character.hitDiceUsed + 1 
        }
      };
    }),

  addSpell: (spell) =>
    set((state) => ({
      character: {
        ...state.character,
        spells: state.character.spells.some(s => s.id === (spell.id || spell.name)) 
          ? state.character.spells 
          : [...state.character.spells, spell]
      }
    })),

  removeSpell: (spellId) =>
    set((state) => ({
      character: {
        ...state.character,
        spells: state.character.spells.filter((s) => (s.id || s.name) !== spellId)
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

  useFeatureResource: (featureId) =>
    set((state) => ({
      character: {
        ...state.character,
        features: state.character.features.map(f => {
          if (f.id === featureId && f.resource && f.resource.remaining > 0) {
            return {
              ...f,
              resource: { ...f.resource, remaining: f.resource.remaining - 1 }
            };
          }
          return f;
        })
      }
    })),

  setFeaturesByKind: (kind, features) =>
    set((state) => ({
      character: {
        ...state.character,
        features: [
          ...state.character.features.filter(f => f.kind !== kind),
          ...features
        ]
      }
    })),

  initiateLevelUp: async () => {
    const { character } = get();
    if (character.level >= 20) return;

    const nextLevel = character.level + 1;
    const assignments = character.backgroundChoices?.abilityAssignments || {};
    const effectiveCon = (character.abilities.con || 10) + (assignments.con || 0);
    const conMod = Math.floor((effectiveCon - 10) / 2);
    
    const dieSize = character.class.toLowerCase().includes('barbarian') ? 12 : 8;
    const hpGain = Math.floor(dieSize / 2) + 1 + conMod;

    try {
      const featuresData = await getFeatures();
      const itemsData = await getItems();
      
      const newFeaturesRaw = (featuresData.results || []).filter(f => 
        f.className?.toLowerCase() === character.class.toLowerCase() && 
        Number(f.level) === nextLevel
      );

      const newFeatures: Feature[] = newFeaturesRaw.map(f => ({
        id: f.id || `${f.name}-${nextLevel}`.toLowerCase().replace(/\s+/g, '-'),
        name: f.name,
        kind: 'class',
        level: nextLevel,
        description: parse5eEntry(f.entries || f.description),
        meta: f.source
      }));

      const newChoices: Choice[] = [];
      newFeatures.forEach(feat => {
        const nameLower = feat.name.toLowerCase();
        if (nameLower === "weapon mastery") {
           const options = itemsData.results.filter(i => {
             const type = i.type?.split('|')[0] || '';
             return type === 'M' || type === 'R';
           }).map(i => i.name);
           
           newChoices.push({
             id: `choice-${feat.id}-${Date.now()}`,
             featureId: feat.id,
             name: feat.name,
             count: 1, 
             options: Array.from(new Set(options)).sort(),
             type: 'weapon'
           });
        }
        
        if (nameLower === "primal knowledge") {
           newChoices.push({
             id: `choice-${feat.id}-${Date.now()}`,
             featureId: feat.id,
             name: "Primal Knowledge: Additional Skill",
             count: 1,
             options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
             type: 'generic'
           });
        }

        if (nextLevel === 3 && (nameLower.includes("subclass") || nameLower.includes("path") || nameLower.includes("circle"))) {
           newChoices.push({
             id: `choice-${feat.id}-${Date.now()}`,
             featureId: feat.id,
             name: `Choose your ${character.class} Subclass`,
             count: 1,
             options: ["Path of the Berserker", "Path of the Wild Heart", "Path of the World Tree", "Path of the Zealot"],
             type: 'subclass'
           });
        }
        
        if (nameLower.includes("ability score improvement")) {
          newChoices.push({
            id: `choice-${feat.id}-${Date.now()}`,
            featureId: feat.id,
            name: "Ability Score Improvement / Feat",
            count: 2,
            options: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
            type: 'asi'
          });
        }
      });

      set({ 
        pendingLevelUp: {
          nextLevel,
          hpGain,
          newFeatures,
          choices: newChoices,
          selections: {}
        }
      });
    } catch (err) {
      console.error('Failed to initiate level up:', err);
    }
  },

  cancelLevelUp: () => set({ pendingLevelUp: null }),

  updateLevelUpSelection: (choiceId, selection) =>
    set((state) => {
      if (!state.pendingLevelUp) return state;
      return {
        pendingLevelUp: {
          ...state.pendingLevelUp,
          selections: {
            ...state.pendingLevelUp.selections,
            [choiceId]: selection
          }
        }
      };
    }),

  finalizeLevelUp: () =>
    set((state) => {
      if (!state.pendingLevelUp) return state;
      const { nextLevel, hpGain, newFeatures, selections, choices } = state.pendingLevelUp;
      
      const nextFeatureChoices = { ...state.character.classFeatureChoices };
      const nextAbilities = { ...state.character.abilities };
      let nextSkillProficiencies = [...state.character.skillProficiencies];

      // Apply all selections made in the modal
      Object.entries(selections).forEach(([choiceId, selection]) => {
        const choice = choices.find(c => c.id === choiceId);
        if (!choice) return;

        nextFeatureChoices[choice.featureId] = [
          ...(nextFeatureChoices[choice.featureId] || []),
          ...selection
        ];

        if (choice.type === 'asi') {
          selection.forEach(abil => {
            const key = abil.toLowerCase() as keyof AbilityScoresType;
            nextAbilities[key] = (nextAbilities[key] || 10) + 1;
          });
        }

        if (choice.type === 'generic' && choice.name.includes("Skill")) {
          nextSkillProficiencies = Array.from(new Set([...nextSkillProficiencies, ...selection]));
        }
      });

      return {
        character: {
          ...state.character,
          level: nextLevel,
          maxHp: (state.character.maxHp || 10) + hpGain,
          hp: (state.character.hp || 0) + hpGain,
          features: [...state.character.features, ...newFeatures],
          classFeatureChoices: nextFeatureChoices,
          abilities: nextAbilities,
          skillProficiencies: nextSkillProficiencies
        },
        pendingLevelUp: null
      };
    }),

  levelUp: async () => {
    // Keep for potential internal use or simple leveling
    const { initiateLevelUp } = get();
    await initiateLevelUp();
  },

  resetLevel: () =>
    set((state) => {
      const baseFeatures = state.character.features.filter(f => !f.level || f.level === 1);
      return {
        character: {
          ...state.character,
          level: 1,
          hp: state.character.maxHp || 10,
          features: baseFeatures,
          pendingChoices: [],
          classFeatureChoices: {},
          spells: state.character.spells.filter(s => s.source !== 'class-level')
        }
      };
    }),

  resolveChoice: (choiceId, selection) =>
    set((state) => {
      const choice = state.character.pendingChoices.find(c => c.id === choiceId);
      if (!choice) return state;

      const nextFeatureChoices = { ...state.character.classFeatureChoices };
      nextFeatureChoices[choice.featureId] = [
        ...(nextFeatureChoices[choice.featureId] || []),
        ...selection
      ];

      let nextCharacter = {
        ...state.character,
        classFeatureChoices: nextFeatureChoices,
        pendingChoices: state.character.pendingChoices.filter(c => c.id !== choiceId)
      };

      if (choice.type === 'asi') {
        const nextAbilities = { ...nextCharacter.abilities };
        selection.forEach(abil => {
          const key = abil.toLowerCase() as keyof AbilityScoresType;
          nextAbilities[key] = (nextAbilities[key] || 10) + 1;
        });
        nextCharacter.abilities = nextAbilities;
      }

      if (choice.type === 'generic' && choice.name.includes("Skill")) {
        nextCharacter.skillProficiencies = Array.from(new Set([...nextCharacter.skillProficiencies, ...selection]));
      }

      return { character: nextCharacter };
    }),

  applyShortRest: () =>
    set((state) => ({
      character: {
        ...state.character,
        features: state.character.features.map(f => {
          if (f.resource) {
            const label = f.resource.recoveryLabel?.toLowerCase() || '';
            if (label.includes('short')) {
              return { ...f, resource: { ...f.resource, remaining: f.resource.max } };
            }
            if (f.name.toLowerCase() === 'rage') {
              return { 
                ...f, 
                resource: { ...f.resource, remaining: Math.min(f.resource.max, f.resource.remaining + 1) } 
              };
            }
            return f;
          }
          return f;
        })
      }
    })),

  applyLongRest: (maxHp) =>
    set((state) => ({
      character: {
        ...state.character,
        hp: maxHp,
        tempHp: 0,
        hitDiceUsed: 0,
        features: state.character.features.map(f => 
          f.resource ? { ...f, resource: { ...f.resource, remaining: f.resource.max } } : f
        ),
        spellSlots: Object.fromEntries(
          Object.entries(state.character.spellSlots).map(([lvl, data]) => [lvl, { ...data, used: 0 }])
        )
      }
    })),

  resetCharacter: () => set({ 
    character: createDefaultCharacter(),
    activeCharacterId: null 
  }),
}));
