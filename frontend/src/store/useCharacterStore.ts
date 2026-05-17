import { create } from 'zustand';
import type { Character, AbilityScores as AbilityScoresType, Feature, Choice, BackgroundChoices } from '../types/character';
import { getLevelUpOptions, getItems, getSpells, getFeats } from '../api/catalog-api';
import { parse5eEntry, parseResourceInfo, extractSpells } from '../lib/data-parser';
import { deriveResourcesFromFeatures } from '../lib/feature-resources';

interface PendingLevelUp {
  nextLevel: number;
  hpGain: number;
  hitDie: number;
  conMod: number;
  newFeatures: Feature[];
  choices: Choice[];
  selections: Record<string, string[]>;
}

interface CharacterState {
  character: Character;
  activeCharacterId: string | null;
  pendingLevelUp: PendingLevelUp | null;
  itemsCatalog: any[];
  spellsCatalog: any[];
  featsCatalog: any[];
  isSaving: boolean;

  // Actions
  setIsSaving: (saving: boolean) => void;
  fetchItemsCatalog: () => Promise<void>;
  fetchSpellsCatalog: () => Promise<void>;
  fetchFeatsCatalog: () => Promise<void>;
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
  updateLevelUpHP: (hpGain: number) => void;
  finalizeLevelUp: () => void;

  levelUp: () => Promise<void>; // Legacy/internal
  resetLevel: () => void;
  resolveChoice: (choiceId: string, selection: string[]) => void;
  applyShortRest: () => void;
  applyLongRest: (maxHp: number) => void;
  resetCharacter: () => void;
  addItem: (item: any) => void;
  removeItem: (instanceId: string) => void;
  updateItemQuantity: (instanceId: string, quantity: number) => void;
  updateCurrency: (currency: Partial<Character['currency']>) => void;
  updateDeathSaves: (successes: number, failures: number) => void;
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
  classes: [],
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
  bgSpellChoices: {},
  currency: { gp: 0, sp: 0, cp: 0, pp: 0, ep: 0 },
  deathSaves: { successes: 0, failures: 0 },
  bgChoices: {
    abilityIncrement: null,
    abilityScores: [],
    spellcastingAbility: null,
    equipmentChoice: null,
    skillChoices: [],
    skillCollisions: []
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

export const useCharacterStore = create<CharacterState>()((set, get) => ({
  character: createDefaultCharacter(),
  activeCharacterId: null,
  pendingLevelUp: null,
  itemsCatalog: [],
  spellsCatalog: [],
  featsCatalog: [],
  isSaving: false,

  setIsSaving: (saving) => set({ isSaving: saving }),

  fetchItemsCatalog: async () => {
    try {
      const res = await getItems();
      set({ itemsCatalog: res.results || [] });
    } catch (err) {
      console.error('Failed to load items catalog in store:', err);
    }
  },

  fetchSpellsCatalog: async () => {
    try {
      const res = await getSpells();
      set({ spellsCatalog: res.results || [] });
    } catch (err) {
      console.error('Failed to load spells catalog in store:', err);
    }
  },

  fetchFeatsCatalog: async () => {
    try {
      const res = await getFeats();
      set({ featsCatalog: res.results || [] });
    } catch (err) {
      console.error('Failed to load feats catalog in store:', err);
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
        const rawClass = primaryClass?.name || primaryClass?.classId || canonical.primaryClass || canonical.class || '';
        // Slugify the class name for internal lookup consistency (e.g. "Wizard" -> "wizard")
        const classSlug = rawClass.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const normalizedClass = rawClass.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

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

        return {
          character: {
            ...createDefaultCharacter(),
            ...canonical,
            id: canonical.id || record.id,
            name: canonical.name,
            class: normalizedClass,
            level: canonical.level || primaryClass?.level || 1,
            classes: canonical.classes?.map((c: any) => ({ ...c, classId: c.classId.toLowerCase() })) || (classSlug ? [{ classId: classSlug, level: canonical.level || 1 }] : []),
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
            bgChoices: bgChoices,
            bgSpellChoices: canonical.bgSpellChoices || {},
            spellSlots: canonical.spellSlots || {},
            currency: canonical.currency || { gp: 0, sp: 0, cp: 0, pp: 0, ep: 0 },
            deathSaves: canonical.deathSaves || { successes: 0, failures: 0 }
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

  addItem: (item, quantity = 1) => set((state) => {
    const inventory = [...(state.character.inventory || [])];
    const baseItemId = item.id || item.name;
    const instanceId = `${baseItemId}-${Date.now()}`;
    
    return {
      character: {
        ...state.character,
        inventory: [...inventory, { ...item, instanceId, baseItemId, quantity: Math.max(1, quantity) }]
      }
    };
  }),

  removeItem: (instanceId) => set((state) => ({
    character: {
      ...state.character,
      inventory: (state.character.inventory || []).filter((item: any) => 
        (item.instanceId || item.id) !== instanceId
      ),
      equippedItems: (state.character.equippedItems || []).filter(id => id !== instanceId)
    }
  })),

  updateItemQuantity: (instanceId, quantity) => set((state) => ({
    character: {
      ...state.character,
      inventory: (state.character.inventory || []).map((item: any) => {
        if ((item.instanceId || item.id) === instanceId) {
          return { ...item, quantity: Math.max(1, quantity) };
        }
        return item;
      })
    }
  })),

  updateCurrency: (currency) => set((state) => ({
    character: {
      ...state.character,
      currency: {
        ...(state.character.currency || { gp: 0, sp: 0, cp: 0, pp: 0, ep: 0 }),
        ...currency
      }
    }
  })),

  updateDeathSaves: (successes, failures) => set((state) => ({
    character: {
      ...state.character,
      deathSaves: { successes, failures }
    }
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
    set((state) => {
      const currentTempHp = state.character.tempHp || 0;
      const damageToTemp = Math.min(currentTempHp, amount);
      const remainingDamage = amount - damageToTemp;

      return {
        character: {
          ...state.character,
          tempHp: currentTempHp - damageToTemp,
          hp: Math.max(0, state.character.hp - remainingDamage)
        }
      };
    }),

  applyHealing: (amount) =>
    set((state) => ({
      character: {
        ...state.character,
        hp: Math.min(state.character.maxHp, state.character.hp + amount),
        deathSaves: { successes: 0, failures: 0 }
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
      
      // Filter features based on character level requirements in description
      const charLevel = state.character.level || 1;
      const levelFilteredFeatures = features.filter(feat => {
        if (!feat.description) return true;
        
        // Match patterns like "At level 3", "When you reach 3rd level", "reach character level 3"
        const levelMatch = feat.description.match(/(?:at|reach(?:\s+character)?)\s+level\s+(\d+)|(\d+)(?:st|nd|rd|th)\s+level/i);
        if (levelMatch) {
          const requiredLevel = parseInt(levelMatch[1] || levelMatch[2]);
          return charLevel >= requiredLevel;
        }
        return true;
      });

      const allFeatures = [...otherFeatures, ...levelFilteredFeatures];
      
      // Auto-discover spells from descriptions (e.g. Aasimar's Light Bearer)
      const spellsCatalog = state.spellsCatalog || [];
      const currentSpellNames = new Set(state.character.spells.map(s => s.name.toLowerCase()));
      const newSpells: any[] = [];
      const profBonus = Math.ceil((state.character.level || 1) / 4) + 1;

      for (const feat of allFeatures) {
        if (!feat.description) continue;
        
        // Skip auto-discovery for core spellcasting/spellbook/cantrips features as they usually 
        // contain example spells or links that shouldn't be automatically learned/added.
        const featName = feat.name.toLowerCase();
        if (
          featName.includes('spellcasting') || 
          featName.includes('spellbook') || 
          featName.includes('cantrip')
        ) continue;

        const foundSpellNames = extractSpells(feat.description);
        
        for (const name of foundSpellNames) {
          if (!currentSpellNames.has(name.toLowerCase())) {
             // Check if this spell is just a recommendation in the text
             // Pattern in cleaned text: [[spell:Name|Source]] ... is/are recommended
             const isRecommended = new RegExp(`\\[\\[spell:${name}(?:\\|[^\\]]*)?\\]\\][^.]*\\s+(?:is|are)\\s+recommended|recommended:?\\s+[^.]*\\[\\[spell:${name}`, 'i').test(feat.description);
             if (isRecommended) continue;

             const spell = spellsCatalog.find(s => s.name.toLowerCase() === name.toLowerCase());
             if (spell) {
               const isCantrip = spell.level === 0 || spell.level === '0';
               // Try to detect if this specific spell cast has a limit mentioned in the feature
               const resource = isCantrip ? undefined : parseResourceInfo(feat.description, state.character, { proficiencyBonus: profBonus, modifiers: {} });

               newSpells.push({
                 ...spell,
                 id: spell.id || spell.name.toLowerCase().replace(/\s+/g, '-'),
                 description: parse5eEntry(spell),
                 originKind: 'feature',
                 originName: feat.name,
                 resource: resource ? { ...resource, id: `spell-res-${spell.name.toLowerCase()}` } : undefined
               });
               currentSpellNames.add(name.toLowerCase());
             }
          }
        }
      }

      return {
        character: {
          ...state.character,
          features: allFeatures,
          spells: [...state.character.spells, ...newSpells]
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
      
      // Sum ASI choices from previous levels
      const conAsi = Object.entries(character.asiChoices || {}).reduce((total, [lvl, choice]: [string, any]) => {
        if (parseInt(lvl) < nextLevel) {
          return total + (Number(choice.con) || 0);
        }
        return total;
      }, 0);

      const totalCon = conBase + conBonus + conAsi;
      const conMod = Math.floor((totalCon - 10) / 2);

      const dieSize = CLASS_HIT_DIE[primaryClass.toLowerCase()] || 8;
      const defaultHpGain = Math.max(1, Math.floor(dieSize / 2) + 1 + conMod);

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
          hpGain: defaultHpGain,
          hitDie: dieSize,
          conMod,
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

  updateLevelUpHP: (hpGain) =>
    set((state) => {
      if (!state.pendingLevelUp) return state;
      return {
        pendingLevelUp: {
          ...state.pendingLevelUp,
          hpGain
        }
      };
    }),

  finalizeLevelUp: () =>
    set((state) => {
      if (!state.pendingLevelUp) return state;

      const { nextLevel, hpGain, newFeatures, choices, selections } = state.pendingLevelUp;

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

      // Process ASI or Feat selection
      const asiChoice = choices.find(c => c.type === 'asi');
      const featChoice = choices.find(c => c.type === 'feat');
      
      let nextAsiChoice: Record<string, number> = {};
      let nextFeatFeatures: Feature[] = [];

      if (asiChoice && selections[asiChoice.id]?.length > 0) {
        const selectedAbilities = selections[asiChoice.id];
        const bonus = selectedAbilities.length === 1 ? 2 : 1;
        selectedAbilities.forEach(ab => {
          nextAsiChoice[ab] = bonus;
        });
      } else if (featChoice && selections[featChoice.id]?.length > 0) {
        const featId = selections[featChoice.id][0];
        const feat = get().featsCatalog.find(f => f.id === featId);
        if (feat) {
          nextFeatFeatures.push({
            id: feat.id,
            name: feat.name,
            kind: 'feat',
            description: parse5eEntry(feat.entries),
            level: nextLevel
          });

          // Special handling for Actor feat (2024)
          if (feat.name.toLowerCase() === 'actor') {
            nextFeatFeatures.push({
              id: 'actor-impersonation',
              name: 'Impersonation',
              kind: 'feat',
              description: 'You have Advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as another person.',
              level: nextLevel
            });
            nextFeatFeatures.push({
              id: 'actor-mimicry',
              name: 'Mimicry',
              kind: 'feat',
              description: 'You can mimic the speech of another person or the sounds made by other creatures. You must have heard the person speaking or heard the creature make the sound for at least 1 minute. A successful Wisdom (Insight) check contested by your Charisma (Deception) check allows a listener to determine that the effect is faked.',
              level: nextLevel
            });
          }

          // Handle fixed ability bonus from feat
          if (feat.ability) {
            feat.ability.forEach((abObj: any) => {
              Object.entries(abObj).forEach(([ab, val]) => {
                if (ab !== 'choose' && typeof val === 'number') {
                   nextAsiChoice[ab] = (nextAsiChoice[ab] || 0) + val;
                }
              });
            });
          }

          // Handle half-feat ability bonus (choice)
          const selectedAbility = selections['feat-ability']?.[0];
          if (selectedAbility) {
            nextAsiChoice[selectedAbility] = (nextAsiChoice[selectedAbility] || 0) + 1;
          }
        }
      }

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

      // Sync classes array for persistence and future multiclass support
      let updatedClasses = state.character.classes || [];
      if (updatedClasses.length === 0 && state.character.class) {
        const slugify = (str: string) => String(str ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        updatedClasses = [{ classId: slugify(state.character.class), level: state.character.level }];
      }

      updatedClasses = updatedClasses.map((cls, idx) => {
        // For now, we assume the first class is the primary one being leveled up
        if (idx === 0) {
          return { ...cls, level: nextLevel };
        }
        return cls;
      });

      // Retroactive HP calculation if CON increased
      let retroactiveHp = 0;
      const oldConBase = state.character.abilities.con || 10;
      const conBonus = state.character.backgroundChoices?.abilityAssignments?.con || 0;
      
      const oldConAsi = Object.entries(state.character.asiChoices || {}).reduce((total, [lvl, choice]: [string, any]) => {
        return total + (Number(choice.con) || 0);
      }, 0);
      
      const oldTotalCon = oldConBase + conBonus + oldConAsi;
      const oldMod = Math.floor((oldTotalCon - 10) / 2);

      const newConAsi = oldConAsi + (nextAsiChoice.con || 0);
      const newTotalCon = oldConBase + conBonus + newConAsi;
      const newMod = Math.floor((newTotalCon - 10) / 2);

      if (newMod > oldMod) {
        retroactiveHp = (newMod - oldMod) * nextLevel;
      }

      return {
        character: {
          ...state.character,
          level: nextLevel,
          classes: updatedClasses,
          maxHp: state.character.maxHp + hpGain + retroactiveHp,
          hp: state.character.hp + hpGain + retroactiveHp,
          features: [...updatedExistingFeatures, ...filteredFeatures, ...nextFeatFeatures],
          asiChoices: {
            ...state.character.asiChoices,
            [nextLevel]: nextAsiChoice
          },
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
        }),
        spells: state.character.spells.map(s => {
          if (s.resource) {
            return { ...s, resource: { ...s.resource, remaining: s.resource.max } };
          }
          return s;
        }),
        spellSlots: Object.fromEntries(
          Object.entries(state.character.spellSlots || {}).map(([level, slots]) => [
            level,
            { ...slots, used: 0 }
          ])
        )
      }
    })),

  resetCharacter: () => set({
    character: createDefaultCharacter(),
    activeCharacterId: null
  }),
}));

if (typeof window !== 'undefined') {
  (window as any).useCharacterStore = useCharacterStore;
}

