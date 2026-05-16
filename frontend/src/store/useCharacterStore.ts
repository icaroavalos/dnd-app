import { create } from 'zustand';
import type { Character, AbilityScores as AbilityScoresType, Feature, Choice, BackgroundChoices } from '../types/character';
import { getLevelUpOptions, getItems } from '../api/catalog-api';
import { parse5eEntry, parseResourceInfo } from '../lib/data-parser';
import { deriveResourcesFromFeatures } from '../lib/feature-resources';

interface PendingLevelUp {
  nextLevel: number;
  hpGain: number;
  newFeatures: Feature[];
  choices: Choice[];
  selections: Record<string, string[]>;
}

interface CharacterState {
  character: Character & { classes?: Array<{ classId: string; level: number }> };
  activeCharacterId: string | null;
  pendingLevelUp: PendingLevelUp | null;
  itemsCatalog: any[];

  // Actions
  fetchItemsCatalog: () => Promise<void>;
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
  toggleSkillProficiency: (skill: string, isClassChoice?: boolean) => void;
  consumeFeatureResource: (featureId: string) => void;
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
  spellSlots: {},
  resources: {},
  creationComplete: false,
  hp: 0,
  maxHp: 0,
  tempHp: 0,
  hitDiceUsed: 0,
  armorClass: 10,
  speed: 30,
  abilities: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
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
  },
  bgChoices: {
    abilityIncrement: null as '2_1' | '1_1_1' | null,
    abilityScores: [] as string[],
    spellcastingAbility: null as string | null,
    equipmentChoice: null as 'A' | 'B' | null,
    skillChoices: [] as string[],
    skillCollisions: [] as string[]
  }
});

export const CLASS_HIT_DIE: Record<string, number> = {
  'barbarian': 12,
  'fighter': 10,
  'paladin': 10,
  'ranger': 10,
  'bard': 8,
  'cleric': 8,
  'druid': 8,
  'monk': 8,
  'rogue': 8,
  'warlock': 8,
  'sorcerer': 6,
  'wizard': 6
};

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: createDefaultCharacter(),
  activeCharacterId: null,
  pendingLevelUp: null,
  itemsCatalog: [],

  fetchItemsCatalog: async () => {
    try {
      const res = await getItems();
      set({ itemsCatalog: res.results || [] });
    } catch (err) {
      console.error('Failed to load items catalog in store:', err);
    }
  },

  setCharacter: (record: any) =>
    set((state) => {
      // Deeply extract the canonical record if available
      let canonical = record;
      if (record.recordJson && record.recordJson !== '{}') {
        try {
          canonical = JSON.parse(record.recordJson);
        } catch (e) {
          console.error('Failed to parse recordJson:', e);
        }
      }

      // If it's a backend record, map it to the frontend Character type
      if (canonical.ruleset || canonical.classes) {
        const primaryClass = canonical.classes?.[0];
        const backgroundChoices = canonical.backgroundChoices || {
          backgroundId: canonical.backgroundId || '',
          abilityAssignments: {}
        };

        const bgChoices: BackgroundChoices = canonical.bgChoices || {
          abilityIncrement: null,
          abilityScores: [],
          spellcastingAbility: null,
          equipmentChoice: null,
          skillChoices: [],
          skillCollisions: []
        };

        const rawClass = primaryClass?.name || primaryClass?.classId || canonical.primaryClass || '';
        const normalizedClass = rawClass.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        return {
          character: {
            ...createDefaultCharacter(),
            ...canonical,
            id: canonical.id || record.id,
            name: canonical.name,
            class: normalizedClass,
            level: primaryClass?.level || canonical.level || 1,
            classes: canonical.classes || [{ classId: rawClass, level: canonical.level || 1 }],
            race: canonical.race || canonical.lineageName || canonical.lineageId || '',
            subrace: canonical.subrace || '',
            background: canonical.background || canonical.backgroundName || canonical.backgroundId || '',
            alignment: canonical.alignment || 'Neutral',
            abilities: canonical.abilities || { str: null, dex: null, con: null, int: null, wis: null, cha: null },
            skillProficiencies: (canonical.skillProficiencies || []).map((s: string) =>
              s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            ),
            savingThrows: canonical.savingThrowProficiencies || canonical.savingThrows || [],
            inventory: canonical.inventory || [],
            resources: Object.keys(canonical.resources || {}).length > 0
              ? canonical.resources
              : deriveResourcesFromFeatures(canonical.features || []),
            spells: canonical.spells || [],
            features: canonical.features || [],
            attacks: canonical.attacks || [],
            equippedItems: canonical.equippedItems || [],
            classFeatureChoices: canonical.classFeatureChoices || {},
            asiChoices: canonical.asiChoices || {},
            equipmentChoices: canonical.equipmentChoices || {},
            hp: canonical.state?.hp || canonical.hp || 10,
            maxHp: canonical.state?.maxHpOverride || canonical.maxHp || 10,
            tempHp: canonical.state?.tempHp || canonical.tempHp || 0,
            hitDiceUsed: canonical.state?.hitDiceUsed || canonical.hitDiceUsed || 0,
            creationComplete: canonical.creationComplete !== undefined ? canonical.creationComplete : true,
            backgroundChoices: backgroundChoices,
            bgChoices: bgChoices
          }
        };
      }

      return { character: { ...state.character, ...canonical } };
    }),

  setActiveCharacterId: (id) => set({ activeCharacterId: id }),

  updateCharacter: (updates) =>
    set((state) => ({
      character: { ...state.character, ...updates }
    })),

  updateAbility: (ability, value) =>
    set((state) => {
      const nextAbilities = {
        ...state.character.abilities,
        [ability]: value
      };

      // Retroactive HP calculation for Constitution changes
      let nextMaxHp = state.character.maxHp;
      let nextHp = state.character.hp;

      if (ability === 'con') {
        const oldBase = state.character.abilities.con || 10;
        const bonus = state.character.backgroundChoices?.abilityAssignments?.con || 0;
        const oldMod = Math.floor((oldBase + bonus - 10) / 2);

        const newMod = Math.floor(((value || 10) + bonus - 10) / 2);
        const modDiff = newMod - oldMod;

        if (modDiff !== 0) {
          const hpAdjustment = modDiff * state.character.level;
          nextMaxHp = state.character.maxHp + hpAdjustment;
          nextHp = state.character.hp + hpAdjustment;
        }
      }

      return {
        character: {
          ...state.character,
          abilities: nextAbilities,
          maxHp: nextMaxHp,
          hp: nextHp
        }
      };
    }),

  setHp: (hp) =>
    set((state) => ({
      character: { ...state.character, hp }
    })),

  applyDamage: (amount) =>
    set((state) => ({
      character: {
        ...state.character,
        hp: Math.max(0, state.character.hp - amount)
      }
    })),

  applyHealing: (amount) =>
    set((state) => ({
      character: {
        ...state.character,
        hp: Math.min(state.character.maxHp, state.character.hp + amount)
      }
    })),

  applyTempHp: (amount) =>
    set((state) => ({
      character: {
        ...state.character,
        tempHp: Math.max(state.character.tempHp, amount)
      }
    })),

  spendHitDie: (roll) =>
    set((state) => ({
      character: {
        ...state.character,
        hitDiceUsed: state.character.hitDiceUsed + 1,
        hp: Math.min(state.character.maxHp, state.character.hp + roll)
      }
    })),

  addSpell: (spell) =>
    set((state) => ({
      character: {
        ...state.character,
        spells: [...state.character.spells, spell]
      }
    })),

  removeSpell: (spellId) =>
    set((state) => ({
      character: {
        ...state.character,
        spells: state.character.spells.filter(s => (s.id || s.name) !== spellId)
      }
    })),

  toggleSkillProficiency: (skill, isClassChoice) =>
    set((state) => {
      const current = state.character.skillProficiencies;
      const isProficient = current.includes(skill);
      let next = isProficient
        ? current.filter(s => s !== skill)
        : [...current, skill];

      let nextClassChoices = state.character.classSkillChoices || [];
      if (isClassChoice) {
        if (isProficient) {
           nextClassChoices = nextClassChoices.filter(s => s !== skill);
        } else {
           nextClassChoices = [...nextClassChoices, skill];
        }
      }

      return {
        character: {
          ...state.character,
          skillProficiencies: next,
          classSkillChoices: nextClassChoices
        }
      };
    }),

  consumeFeatureResource: (featureId) =>
    set((state) => {
      const features = state.character.features.map(f => {
        if (f.id === featureId && f.resource) {
          return {
            ...f,
            resource: {
              ...f.resource,
              remaining: Math.max(0, f.resource.remaining - 1)
            }
          };
        }
        return f;
      });
      return { character: { ...state.character, features } };
    }),

  setFeaturesByKind: (kind, features) =>
    set((state) => {
      const otherFeatures = state.character.features.filter(f => f.kind !== kind);
      return {
        character: {
          ...state.character,
          features: [...otherFeatures, ...features]
        }
      };
    }),

  initiateLevelUp: async () => {
    const { character } = get();
    const primaryClass = character.class;
    const nextLevel = character.level + 1;

    try {
      const options = await getLevelUpOptions(primaryClass, nextLevel);

      // Calculate HP gain including Constitution modifier
      const conBase = character.abilities.con || 10;
      const conBonus = character.backgroundChoices?.abilityAssignments?.con || 0;
      const conMod = Math.floor((conBase + conBonus - 10) / 2);

      const dieSize = CLASS_HIT_DIE[primaryClass.toLowerCase()] || 8;
      const hpGain = Math.floor(dieSize / 2) + 1 + conMod;

      const newFeatures = (options.features || []).map((f: any) => ({
        id: f.id || `${f.name}-${nextLevel}`.toLowerCase().replace(/\s+/g, '-'),
        name: f.name,
        kind: 'class',
        description: parse5eEntry(f.entries || f.description),
        meta: f.source,
        subclassShortName: f.subclassShortName
      }));

      const choices = (options.choices || []).map((c: any) => {
        if (c.type === 'expertise') {
          // Double expertise: remove existing expertise from options
          const existingExpertise = character.features
            .filter(f => f.name === 'Expertise')
            .flatMap(f => f.description.match(/[A-Z][a-z]+/g) || []);

          const available = character.skillProficiencies.filter(s => !existingExpertise.includes(s));

          return { ...c, options: available.sort() };
        }
        return c;
      });

      set({
        pendingLevelUp: {
          nextLevel,
          hpGain,
          newFeatures,
          choices,
          selections: {}
        }
      });
    } catch (err) {
      console.error('Level up failed:', err);
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

      const { nextLevel, hpGain, newFeatures, selections } = state.pendingLevelUp;

      // Filter features by subclass choice if applicable
      const selectedSubclassChoice = Object.entries(selections).find(([id]) => id.startsWith('subclass-'));
      const selectedSubclassLabel = selectedSubclassChoice?.[1]?.[0];

      // Expanded subclass map
      const SUBCLASS_MAP: Record<string, string> = {
        'Path of the Berserker': 'Berserker',
        'Path of the Wild Heart': 'Wild Heart',
        'Path of the World Tree': 'World Tree',
        'Path of the Zealot': 'Zealot',
        'College of Lore': 'Lore',
        'College of Valor': 'Valor',
        'College of Glamour': 'Glamour',
        'Oath of Devotion': 'Devotion',
        'Oath of Ancients': 'Ancients',
        'Oath of Vengeance': 'Vengeance',
        'Life Domain': 'Life',
        'Light Domain': 'Light',
        'Trickery Domain': 'Light'
      };

      const selectedSubclassShort = selectedSubclassLabel ? SUBCLASS_MAP[selectedSubclassLabel] : null;

      const profBonus = Math.ceil(nextLevel / 4) + 1;

      // Refresh resource limits for existing features
      const updatedExistingFeatures = state.character.features.map(f => {
        const resource = parseResourceInfo(f.description, { ...state.character, level: nextLevel }, { proficiencyBonus: profBonus, modifiers: {} });
        if (resource) {
           resource.id = f.resource?.id || f.id;
           const maxDiff = resource.max - (f.resource?.max || 0);
           resource.remaining = (f.resource?.remaining || 0) + maxDiff;
           return { ...f, resource };
        }
        return f;
      });

      const filteredFeatures = newFeatures.filter(f => {
        if (!f.subclassShortName) return true;
        return f.subclassShortName === selectedSubclassShort;
      }).map(f => {
        // Auto-detect resources for new features
        const resource = parseResourceInfo(f.description, { ...state.character, level: nextLevel }, { proficiencyBonus: profBonus, modifiers: {} });
        if (resource) resource.id = f.id;
        return { ...f, resource };
      });

      return {
        character: {
          ...state.character,
          level: nextLevel,
          maxHp: state.character.maxHp + hpGain,
          hp: state.character.hp + hpGain,
          features: [...updatedExistingFeatures, ...filteredFeatures],
          classFeatureChoices: {
            ...state.character.classFeatureChoices,
            ...selections
          }
        },
        pendingLevelUp: null
      };
    }),

  levelUp: async () => {
    // Legacy implementation - just increment level and HP
    const { character } = get();
    const hpGain = Math.floor(CLASS_HIT_DIE[character.class.toLowerCase()] / 2) + 1;

    set((state) => ({
      character: {
        ...state.character,
        level: state.character.level + 1,
        maxHp: state.character.maxHp + hpGain,
        hp: state.character.hp + hpGain
      }
    }));
  },

  resetLevel: () =>
    set((state) => ({
      character: {
        ...state.character,
        level: 1,
        hp: state.character.maxHp, // Simplified
        features: state.character.features.filter(f => f.kind !== 'class')
      }
    })),

  resolveChoice: (choiceId) =>
    set((state) => ({
      character: {
        ...state.character,
        pendingChoices: state.character.pendingChoices.filter(c => c.id !== choiceId)
      }
    })),

  applyShortRest: () =>
    set((state) => ({
      character: {
        ...state.character,
        hitDiceUsed: Math.max(0, state.character.hitDiceUsed - Math.floor(state.character.level / 2)),
        features: state.character.features.map(f => {
          if (!f.resource) return f;

          const label = f.resource.recoveryLabel.toLowerCase();
          const isShortRestFeature = label.includes('short') || label.includes('curto');

          // Strategy: Increment (like 2024 Rage: +1 on Short Rest)
          if (f.resource.recovery === 'inc') {
            return {
              ...f,
              resource: {
                ...f.resource,
                remaining: Math.min(f.resource.max, f.resource.remaining + (f.resource.recoveryAmount || 1))
              }
            };
          }

          // Strategy: Full (Default for most Short Rest features)
          if (isShortRestFeature) {
            return { ...f, resource: { ...f.resource, remaining: f.resource.max } };
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
        features: state.character.features.map(f => {
          if (f.resource) {
            return { ...f, resource: { ...f.resource, remaining: f.resource.max } };
          }
          return f;
        })
      }
    })),

  resetCharacter: () => set({
    character: createDefaultCharacter(),
    activeCharacterId: null
  }),
}));
