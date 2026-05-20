import { create } from 'zustand';
import type { Character, AbilityScores as AbilityScoresType, Feature, Choice, BackgroundChoices } from '../types/character';
import { getLevelUpOptions, getItems, getSpells, getFeats, getClasses, getClassSpells } from '../api/catalog-api';
import { parse5eEntry, parseResourceInfo, extractSpells } from '../lib/data-parser';
import { deriveResourcesFromFeatures, syncResourcesWithFeatures } from '../lib/feature-resources';
import {
  buildExclusiveFeatureChoices,
  classCantripLimit,
  classPreparedSpellLimit,
  classResourceLimit,
  filterSelectedFeatures,
  normalizeSubclassName,
  stableFeatureId,
} from '../lib/character-rules';

interface PendingLevelUp {
  nextLevel: number;
  hpGain: number;
  hitDie: number;
  conMod: number;
  newFeatures: Feature[];
  choices: Choice[];
  selections: Record<string, string[]>;
  classEntry?: any;
  spellCatalog?: any[];
}

interface CharacterState {
  character: Character;
  activeCharacterId: string | null;
  pendingLevelUp: PendingLevelUp | null;
  itemsCatalog: any[];
  spellsCatalog: any[];
  classSpellsCatalog: Record<string, string[]>;
  featsCatalog: any[];
  isSaving: boolean;

  // Actions
  setIsSaving: (saving: boolean) => void;
  fetchItemsCatalog: () => Promise<void>;
  fetchSpellsCatalog: () => Promise<void>;
  fetchFeatsCatalog: () => Promise<void>;
  setCharacter: (character: any) => void;
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
  addClassSpell: (spell: any) => void;
  replaceSpell: (oldSpellId: string, newSpell: any) => void;
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
  addItem: (item: any, quantity?: number) => void;
  removeItem: (instanceId: string) => void;
  updateItemQuantity: (instanceId: string, quantity: number) => void;
  updateCurrency: (currency: Partial<Character['currency']>) => void;
  updateDeathSaves: (successes: number, failures: number) => void;
  equipItem: (instanceId: string, slot: string) => { success: boolean; message?: string };
  unequipItem: (instanceId: string) => void;
  setAcFormula: (formulaId: string) => void;
  updatePreparedSpells: (spellIds: string[]) => void;
  finalizePreparation: () => void;
}

const inferSpellcastingAbilityFromFeature = (description: string): 'int' | 'wis' | 'cha' | undefined => {
  const match = description.match(/\b(Intelligence|Wisdom|Charisma)\s+is\s+your\s+spellcasting\s+ability\s+for\s+(?:it|this spell|these spells)\b/i);
  const ability = match?.[1]?.toLowerCase();

  if (ability === 'intelligence') return 'int';
  if (ability === 'wisdom') return 'wis';
  if (ability === 'charisma') return 'cha';
  return undefined;
};

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
  preparedSpells: [],
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

function maxSpellLevelForClass(classEntry: any, level: number): number {
  const rows = classEntry?.classTableGroups?.find((group: any) => Array.isArray(group.rowsSpellProgression))
    ?.rowsSpellProgression;
  const row = rows?.[Math.max(0, level - 1)];
  if (!Array.isArray(row)) return Math.max(1, Math.ceil(level / 2));
  const index = row.reduce((highest: number, value: unknown, currentIndex: number) =>
    Number(value) > 0 ? currentIndex : highest, -1);
  return Math.max(1, index + 1);
}

function extractGrantedSpellNamesForLevel(feature: Feature & { entries?: any[] }, characterLevel: number): string[] {
  const rows: any[] = [];
  const visit = (entry: any) => {
    if (!entry) return;
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    if (typeof entry === 'object') {
      if (entry.type === 'table' && Array.isArray(entry.rows)) rows.push(...entry.rows);
      Object.values(entry).forEach(visit);
    }
  };
  visit(feature.entries || []);

  if (rows.length > 0) {
    return rows.flatMap((row) => {
      const requiredLevel = Number(String(row?.[0] || '').match(/\d+/)?.[0] || 0);
      if (requiredLevel && requiredLevel > characterLevel) return [];
      return extractSpellTags(String(row?.slice(1).join(' ') || ''));
    });
  }

  const description = feature.description || '';
  if (/\brecommended\b/i.test(description)) return [];
  if (!/always have|you know|prepared/i.test(description)) return [];
  return extractSpells(description);
}

function extractSpellTags(text: string): string[] {
  return [...String(text).matchAll(/\{@spell\s+([^|}]+)(?:\|[^}]*)?}/gi)].map((match) => match[1]);
}

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
  classSpellsCatalog: {},
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
      const [spellsRes, classSpellsRes] = await Promise.all([
        getSpells(),
        getClassSpells()
      ]);
      
      const formattedClassSpells: Record<string, string[]> = {};
      const results = classSpellsRes.results || [];
      if (Array.isArray(results)) {
        results.forEach((item: any) => {
          if (item && item.className && item.classSource) {
            const key = `${item.className.toLowerCase()}|${item.classSource.toLowerCase()}`;
            formattedClassSpells[key] = (item.spells || []).map((s: any) => s.name);
          }
        });
      }

      set({ 
        spellsCatalog: spellsRes.results || [],
        classSpellsCatalog: formattedClassSpells
      });
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
      if (!record) return state;

      let canonical = record;
      if (record.recordJson && record.recordJson !== '{}') {
        try {
          canonical = JSON.parse(record.recordJson);
        } catch (e) {
          console.error('Failed to parse recordJson:', e);
        }
      }

      // Base class mapping
      const primaryClass = (canonical.classes || []).find((c: any) => c.level > 0);
      const rawClass = canonical.class || primaryClass?.name || primaryClass?.classId || '';
      const normalizedClass = String(rawClass).split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      
      const normalizedFeatures = (canonical.features || []).map((feat: any) => {
        const newFeat = { ...feat };
        if (!newFeat.originName) {
          switch (newFeat.kind) {
            case 'class':
            case 'subclass':
              newFeat.originName = normalizedClass;
              break;
            case 'species':
            case 'subspecies':
              newFeat.originName = canonical.race;
              break;
            case 'background':
              newFeat.originName = canonical.background;
              break;
            case 'feat':
              newFeat.originName = newFeat.name;
              break;
          }
        }
        if (newFeat.level === undefined || newFeat.level === null) {
          if (newFeat.kind === 'species' || newFeat.kind === 'background') {
            newFeat.level = 1;
          } else if (newFeat.kind === 'class' && !newFeat.name.toLowerCase().includes('subclass')) {
             // This is a heuristic: try to find level from catalog if missing.
             // For now, let's assume level 1 for base class features if not specified.
             // A better solution requires DB migration or complex lookup.
             newFeat.level = feat.level || 1;
          }
        }
        return newFeat;
      });

      return {
        character: {
          ...createDefaultCharacter(),
          ...canonical,
          id: record.id || canonical.id,
          name: canonical.name || '',
          class: normalizedClass,
          level: canonical.level || primaryClass?.level || 1,
          classes: (canonical.classes || []).map((c: any) => ({ ...c, classId: String(c.classId || '').toLowerCase() })),
          abilities: canonical.abilities || { str: null, dex: null, con: null, int: null, wis: null, cha: null },
          inventory: (canonical.inventory || []).map((item: any, idx: number) => {
            if (typeof item === 'string') return { baseItemId: item, instanceId: `${item}-${Date.now()}-${idx}`, quantity: 1, status: 'backpack' };
            return {
              ...item,
              instanceId: item.instanceId || item.id || `${item.baseItemId || 'item'}-${Date.now()}-${idx}`
            };
          }),
          preparedSpells: canonical.preparedSpells || [],
          equippedSlots: canonical.equippedSlots || {},
          acFormulaId: canonical.acFormulaId || 'standard',
          _needsPreparation: canonical._needsPreparation || false,
          resources: syncResourcesWithFeatures(canonical.resources || {}, normalizedFeatures),
          currency: canonical.currency || { gp: 0, sp: 0, cp: 0, pp: 0, ep: 0 },
          hp: canonical.state?.hp !== undefined ? canonical.state.hp : (canonical.hp || 10),
          maxHp: canonical.state?.maxHpOverride || canonical.maxHp || 10,
          tempHp: canonical.state?.tempHp || canonical.tempHp || 0,
          hitDiceUsed: canonical.state?.hitDiceUsed || canonical.hitDiceUsed || 0,
          features: normalizedFeatures,
        }
      };
    }),

  setActiveCharacterId: (id) => set({ activeCharacterId: id }),

  updateCharacter: (updates) =>
    set((state) => ({
      character: { ...state.character, ...updates }
    })),

  addItem: (item, quantity = 1) => set((state) => {
    const inventory = [...(state.character.inventory || [])];
    const baseItemId = item.id || item.name;
    const instanceId = `${baseItemId.split('|')[0]}-${Date.now()}`;
    
    return {
      character: {
        ...state.character,
        inventory: [...inventory, { ...item, instanceId, baseItemId, quantity: Math.max(1, quantity) }]
      }
    };
  }),

  removeItem: (instanceId) => set((state) => {
    const nextInventory = (state.character.inventory || []).filter((item: any) => 
      (item.instanceId || item.id) !== instanceId
    );
    const nextEquippedSlots = { ...(state.character.equippedSlots || {}) };
    Object.keys(nextEquippedSlots).forEach(slot => {
      if (nextEquippedSlots[slot] === instanceId) {
        delete nextEquippedSlots[slot];
      }
    });

    return {
      character: {
        ...state.character,
        inventory: nextInventory,
        equippedItems: (state.character.equippedItems || []).filter(id => id !== instanceId),
        equippedSlots: nextEquippedSlots
      }
    };
  }),

  equipItem: (instanceId, slot) => {
    const { character } = get();
    const item = character.inventory.find(i => i.instanceId === instanceId);
    if (!item) return { success: false, message: 'Item não encontrado.' };

    const nextSlots = { ...(character.equippedSlots || {}) };
    const isTwoHanded = Array.isArray(item.properties) ? item.properties.includes('2H') : String(item.properties || '').includes('2H');

    // Slot validation logic
    if (slot === 'equipped_armor') {
      if (nextSlots.equipped_armor && nextSlots.equipped_armor !== instanceId) {
        return { success: false, message: 'Você já possui uma armadura equipada.' };
      }
    }

    if (slot === 'equipped_shield') {
      if (nextSlots.equipped_shield && nextSlots.equipped_shield !== instanceId) {
        return { success: false, message: 'Você já possui um escudo equipado.' };
      }
      if (nextSlots.equipped_main_hand && nextSlots.equipped_main_hand !== instanceId) {
        const mainItem = character.inventory.find(i => i.instanceId === nextSlots.equipped_main_hand);
        const mainIs2H = Array.isArray(mainItem?.properties) ? mainItem?.properties.includes('2H') : String(mainItem?.properties || '').includes('2H');
        if (mainIs2H) return { success: false, message: `Mãos ocupadas (${mainItem?.name || 'Arma'}).` };
      }
    }

    if (slot === 'equipped_main_hand' || slot === 'equipped_off_hand') {
      if (isTwoHanded) {
        const conflictId = nextSlots.equipped_main_hand || nextSlots.equipped_off_hand || nextSlots.equipped_shield;
        if (conflictId && conflictId !== instanceId) {
          const conflict = character.inventory.find(i => i.instanceId === conflictId);
          return { success: false, message: `Mãos ocupadas (${conflict?.name || 'Item'}).` };
        }
      } else {
        if (nextSlots[slot] && nextSlots[slot] !== instanceId) {
          const conflict = character.inventory.find(i => i.instanceId === nextSlots[slot]);
          return { success: false, message: `Slot ocupado (${conflict?.name || 'Item'}).` };
        }
        if (slot === 'equipped_off_hand' && nextSlots.equipped_main_hand && nextSlots.equipped_main_hand !== instanceId) {
          const mainItem = character.inventory.find(i => i.instanceId === nextSlots.equipped_main_hand);
          const mainIs2H = Array.isArray(mainItem?.properties) ? mainItem?.properties.includes('2H') : String(mainItem?.properties || '').includes('2H');
          if (mainIs2H) return { success: false, message: `Mãos ocupadas (${mainItem?.name || 'Arma'}).` };
        }
      }
    }

    nextSlots[slot] = instanceId;
    const nextEquippedItems = Array.from(new Set([...character.equippedItems, instanceId]));

    set({
      character: {
        ...character,
        equippedSlots: nextSlots,
        equippedItems: nextEquippedItems,
        inventory: character.inventory.map(i => i.instanceId === instanceId ? { ...i, status: slot } : i)
      }
    });

    return { success: true };
  },

  unequipItem: (instanceId) => set((state) => {
    const nextSlots = { ...(state.character.equippedSlots || {}) };
    Object.keys(nextSlots).forEach(key => {
      if (nextSlots[key] === instanceId) delete nextSlots[key];
    });

    return {
      character: {
        ...state.character,
        equippedSlots: nextSlots,
        equippedItems: (state.character.equippedItems || []).filter(id => id !== instanceId),
        inventory: (state.character.inventory || []).map(i => i.instanceId === instanceId ? { ...i, status: 'backpack' } : i)
      }
    };
  }),

  setAcFormula: (formulaId) => set((state) => ({
    character: { ...state.character, acFormulaId: formulaId }
  })),

  updatePreparedSpells: (spellIds) => set((state) => ({
    character: { ...state.character, preparedSpells: spellIds }
  })),

  finalizePreparation: () => set((state) => ({
    character: { ...state.character, _needsPreparation: false }
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
      const nextAbilities = { ...state.character.abilities, [ability]: value };
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
        character: { ...state.character, abilities: nextAbilities, maxHp: nextMaxHp, hp: nextHp }
      };
    }),

  setHp: (hp) => set((state) => ({ character: { ...state.character, hp } })),

  applyDamage: (amount) => set((state) => {
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

  applyHealing: (amount) => set((state) => ({
    character: {
      ...state.character,
      hp: Math.min(state.character.maxHp, state.character.hp + amount),
      deathSaves: { successes: 0, failures: 0 }
    }
  })),

  applyTempHp: (amount) => set((state) => ({
    character: { ...state.character, tempHp: Math.max(state.character.tempHp, amount) }
  })),

  spendHitDie: (roll) => set((state) => ({
    character: {
      ...state.character,
      hitDiceUsed: state.character.hitDiceUsed + 1,
      hp: Math.min(state.character.maxHp, state.character.hp + roll)
    }
  })),

  addSpell: (spell) => set((state) => ({
    character: { ...state.character, spells: [...state.character.spells, spell] }
  })),

  addClassSpell: (spell) => set((state) => ({
    character: { 
      ...state.character, 
      spells: [...state.character.spells, { ...spell, originKind: 'class', source: 'XPHB' }] 
    }
  })),

  removeSpell: (spellId) => set((state) => ({
    character: { ...state.character, spells: state.character.spells.filter(s => (s.id || s.name) !== spellId) }
  })),

  replaceSpell: (oldSpellId, newSpell) => set((state) => ({
    character: {
      ...state.character,
      spells: state.character.spells.map(s => 
        (s.id || s.name) === oldSpellId ? { ...newSpell, originKind: 'class', source: 'XPHB' } : s
      )
    }
  })),

  toggleSkillProficiency: (skill, isClassChoice) => set((state) => {
    const current = state.character.skillProficiencies;
    const isProficient = current.includes(skill);
    const next = isProficient ? current.filter(s => s !== skill) : [...current, skill];
    let nextClassChoices = state.character.classSkillChoices || [];
    if (isClassChoice) {
      if (isProficient) nextClassChoices = nextClassChoices.filter(s => s !== skill);
      else nextClassChoices = [...nextClassChoices, skill];
    }
    return { character: { ...state.character, skillProficiencies: next, classSkillChoices: nextClassChoices } };
  }),

  consumeFeatureResource: (featureId) => set((state) => {
    const features = state.character.features.map(f => {
      if (f.id === featureId && f.resource) {
        return { ...f, resource: { ...f.resource, remaining: Math.max(0, f.resource.remaining - 1) } };
      }
      return f;
    });
    return { character: { ...state.character, features } };
  }),

  setFeaturesByKind: (kind, features) => set((state) => {
    const otherFeatures = state.character.features.filter(f => f.kind !== kind);
    const charLevel = state.character.level || 1;

    const levelFilteredFeatures = features.map(feat => {
      let originName = feat.originName || '';
      let level = feat.level;

      if (kind === 'species' || kind === 'background') {
        if (!originName) {
          originName = kind === 'species' ? state.character.race : state.character.background;
        }
        if (!level) {
          level = 1;
        }
      }
      return { ...feat, originName, level };
    }).filter(feat => {
      // This secondary filter remains to handle features that might have an internal level requirement
      if (feat.level && feat.level > charLevel) return false;
      const levelMatch = feat.description?.match(/(?:at|reach(?:\s+character)?)\s+level\s+(\d+)|(\d+)(?:st|nd|rd|th)\s+level/i);
      if (levelMatch) {
        const requiredLevel = parseInt(levelMatch[1] || levelMatch[2]);
        return charLevel >= requiredLevel;
      }
      return true;
    });

    const allFeatures = [...otherFeatures, ...levelFilteredFeatures];
    const spellsCatalog = state.spellsCatalog || [];
    const currentSpellNames = new Set(state.character.spells.map(s => s.name.toLowerCase()));
    const newSpells: any[] = [];
    const profBonus = Math.ceil((state.character.level || 1) / 4) + 1;

    for (const feat of allFeatures) {
      if (!feat.description) continue;
      const featName = feat.name.toLowerCase();
      if (featName.includes('spellcasting') || featName.includes('spellbook') || featName.includes('cantrip')) continue;
      const foundSpellNames = extractSpells(feat.description);
      for (const name of foundSpellNames) {
        if (!currentSpellNames.has(name.toLowerCase())) {
           const isRecommended = new RegExp(`\\[\\[spell:${name}(?:\\|[^\\]]*)?\\]\\][^.]*\\s+(?:is|are)\\s+recommended|recommended:?\\s+[^.]*\\[\\[spell:${name}`, 'i').test(feat.description);
           if (isRecommended) continue;
           const spell = spellsCatalog.find(s => s.name.toLowerCase() === name.toLowerCase());
           if (spell) {
             const isCantrip = spell.level === 0 || spell.level === '0';
             const resource = isCantrip ? undefined : parseResourceInfo(feat.description, state.character, { proficiencyBonus: profBonus, modifiers: {} });
             newSpells.push({
               ...spell,
               id: spell.id || spell.name.toLowerCase().replace(/\s+/g, '-'),
               description: parse5eEntry(spell),
               originKind: 'feature',
               originName: feat.name,
               spellcastingAbility: inferSpellcastingAbilityFromFeature(feat.description),
               resource: resource ? { ...resource, id: `spell-res-${spell.name.toLowerCase()}` } : undefined
             });
             currentSpellNames.add(name.toLowerCase());
           }
        }
      }
    }
    return { character: { ...state.character, features: allFeatures, spells: [...state.character.spells, ...newSpells] } };
  }),

  initiateLevelUp: async () => {
    const { character } = get();
    const primaryClass = character.class;
    const nextLevel = character.level + 1;
    try {
      const options = await getLevelUpOptions(primaryClass, nextLevel);
      const [classesData, classSpellsData, spellsData] = await Promise.all([
        getClasses(),
        getClassSpells(),
        getSpells()
      ]);
      const classEntry = (classesData.results || []).find((cls: any) => cls.name?.toLowerCase() === primaryClass?.toLowerCase());
      const classSpellEntry = (classSpellsData.results || []).find((entry: any) => entry.className?.toLowerCase() === primaryClass?.toLowerCase());
      const spellCatalog = spellsData.results || [];
      const isWizard = primaryClass?.toLowerCase() === 'wizard';
      const choices = options.choices || [];
      if (isWizard) {
        const spellsCatalog = get().spellsCatalog || [];
        const maxSpellLevel = Math.ceil(nextLevel / 2);
        const availableWizardSpells = spellsCatalog.filter(s => s.level > 0 && s.level <= maxSpellLevel).map(s => s.name).sort();
        choices.push({ id: `wizard-spells-${nextLevel}`, type: 'generic', name: 'Novas Magias do Grimório', description: `Escolha 2 novas magias de mago para adicionar ao seu grimório.`, count: 2, options: availableWizardSpells });
        if (nextLevel === 3) {
          choices.push({ id: 'wizard-savant-spells', type: 'generic', name: 'Mago Erudito (Savant)', description: 'Escolha 2 magias adicionais da sua escola de subclasse.', count: 2, options: availableWizardSpells });
        }
      }
      const conBase = character.abilities.con || 10;
      const conBonus = character.backgroundChoices?.abilityAssignments?.con || 0;
      const conAsi = Object.entries(character.asiChoices || {}).reduce((total, [lvl, choice]: [string, any]) => {
        if (parseInt(lvl) < nextLevel) return total + (Number(choice.con) || 0);
        return total;
      }, 0);
      const conMod = Math.floor((conBase + conBonus + conAsi - 10) / 2);
      const dieSize = CLASS_HIT_DIE[primaryClass.toLowerCase()] || 8;
      const defaultHpGain = Math.max(1, Math.floor(dieSize / 2) + 1 + conMod);
      const newFeatures = (options.features || []).map((f: any) => ({ 
        id: stableFeatureId(f, nextLevel), 
        name: f.name, 
        kind: 'class', 
        description: parse5eEntry(f.entries || f.description), 
        entries: f.entries,
        meta: f.source, 
        subclassShortName: f.subclassShortName,
        level: nextLevel,
        originName: primaryClass
      }));
      choices.push(...buildExclusiveFeatureChoices(newFeatures as any));

      const classSpellNames = new Set((classSpellEntry?.spells || []).map((spell: any) => spell.name));
      const availableClassSpells = spellCatalog.filter((spell: any) => classSpellNames.has(spell.name));
      const currentClassSpells = (character.spells || []).filter((spell: any) => spell.originKind === 'class');
      const currentCantrips = currentClassSpells.filter((spell: any) => Number(spell.level) === 0).length;
      const currentPrepared = currentClassSpells.filter((spell: any) => Number(spell.level) > 0).length;
      const cantripLimit = classCantripLimit(classEntry, nextLevel);
      const preparedLimit = classPreparedSpellLimit(classEntry, nextLevel);
      const maxSpellLevel = maxSpellLevelForClass(classEntry, nextLevel);

      if (cantripLimit !== null && cantripLimit > currentCantrips) {
        choices.push({
          id: `class-cantrips-${nextLevel}`,
          featureId: `spellcasting-${nextLevel}`,
          type: 'generic',
          name: 'Novos Truques',
          description: `Escolha ${cantripLimit - currentCantrips} novo(s) truque(s) de ${primaryClass}.`,
          count: cantripLimit - currentCantrips,
          options: availableClassSpells.filter((spell: any) => Number(spell.level) === 0).map((spell: any) => spell.name).sort()
        });
      }

      if (preparedLimit !== null && preparedLimit > currentPrepared) {
        choices.push({
          id: `class-prepared-spells-${nextLevel}`,
          featureId: `spellcasting-${nextLevel}`,
          type: 'generic',
          name: 'Novas Magias Preparadas',
          description: `Escolha ${preparedLimit - currentPrepared} magia(s) preparada(s) de ${primaryClass}.`,
          count: preparedLimit - currentPrepared,
          options: availableClassSpells
            .filter((spell: any) => Number(spell.level) > 0 && Number(spell.level) <= maxSpellLevel)
            .map((spell: any) => spell.name)
            .sort()
        });
      }

      set({ spellsCatalog: spellCatalog, pendingLevelUp: { nextLevel, hpGain: defaultHpGain, hitDie: dieSize, conMod, newFeatures, choices, selections: {}, classEntry, spellCatalog } });
    } catch (err) { console.error('Level up failed:', err); }
  },

  cancelLevelUp: () => set({ pendingLevelUp: null }),

  updateLevelUpSelection: (choiceId, selection) => set((state) => {
    if (!state.pendingLevelUp) return state;
    return { pendingLevelUp: { ...state.pendingLevelUp, selections: { ...state.pendingLevelUp.selections, [choiceId]: selection } } };
  }),

  updateLevelUpHP: (hpGain) => set((state) => {
    if (!state.pendingLevelUp) return state;
    return { pendingLevelUp: { ...state.pendingLevelUp, hpGain } };
  }),

  finalizeLevelUp: () => set((state) => {
    if (!state.pendingLevelUp) return state;
    const { nextLevel, hpGain, newFeatures, choices, selections, classEntry, spellCatalog } = state.pendingLevelUp;
    const SUBCLASS_MAP: Record<string, string> = { 'Path of the Berserker': 'Berserker', 'Path of the Wild Heart': 'Wild Heart', 'Path of the World Tree': 'World Tree', 'Path of the Zealot': 'Zealot' };
    const combinedSelections = { ...state.character.classFeatureChoices, ...selections };
    const selectedSubclassLabel = Object.entries(combinedSelections).find(([id]) => id.startsWith('subclass-'))?.[1]?.[0];
    const selectedSubclassShort = selectedSubclassLabel ? SUBCLASS_MAP[selectedSubclassLabel] : null;
    const selectedSubclassKey = selectedSubclassShort || normalizeSubclassName(selectedSubclassLabel || '');
    const asiChoice = choices.find(c => c.type === 'asi');
    const featChoice = choices.find(c => c.type === 'feat');
    let nextAsiChoice: Record<string, number> = {};
    let nextFeatFeatures: Feature[] = [];
    if (asiChoice && selections[asiChoice.id]?.length > 0) {
      const selectedAbilities = selections[asiChoice.id];
      const bonus = selectedAbilities.length === 1 ? 2 : 1;
      selectedAbilities.forEach(ab => { nextAsiChoice[ab] = bonus; });
    } else if (featChoice && selections[featChoice.id]?.length > 0) {
      const featId = selections[featChoice.id][0];
      const feat = get().featsCatalog.find(f => f.id === featId);
      if (feat) {
        nextFeatFeatures.push({ 
          id: feat.id, 
          name: feat.name, 
          kind: 'feat', 
          description: parse5eEntry(feat.entries), 
          level: nextLevel,
          originName: feat.name
        });
        if (feat.name.toLowerCase() === 'actor') {
          nextFeatFeatures.push({ id: 'actor-impersonation', name: 'Impersonation', kind: 'feat', description: 'You have Advantage on Charisma...', level: nextLevel, originName: 'Actor' });
          nextFeatFeatures.push({ id: 'actor-mimicry', name: 'Mimicry', kind: 'feat', description: 'You can mimic...', level: nextLevel, originName: 'Actor' });
        }
        if (feat.ability) feat.ability.forEach((abObj: any) => { Object.entries(abObj).forEach(([ab, val]) => { if (ab !== 'choose' && typeof val === 'number') nextAsiChoice[ab] = (nextAsiChoice[ab] || 0) + val; }); });
        const selectedAbility = selections['feat-ability']?.[0];
        if (selectedAbility) nextAsiChoice[selectedAbility] = (nextAsiChoice[selectedAbility] || 0) + 1;
      }
    }
    const profBonus = Math.ceil(nextLevel / 4) + 1;
    const updatedExistingFeatures = state.character.features.map(f => {
      const resource = parseResourceInfo(f.description, { ...state.character, level: nextLevel }, { proficiencyBonus: profBonus, modifiers: {} });
      const tableMax = classResourceLimit(classEntry, nextLevel, f.name);
      if (resource) {
        resource.id = f.resource?.id || f.id;
        if (tableMax) resource.max = tableMax;
        const maxDiff = resource.max - (f.resource?.max || 0);
        resource.remaining = (f.resource?.remaining || 0) + maxDiff;
        return { ...f, resource };
      }
      if (f.resource && tableMax) {
        const maxDiff = tableMax - f.resource.max;
        return { ...f, resource: { ...f.resource, max: tableMax, remaining: Math.min(tableMax, f.resource.remaining + Math.max(0, maxDiff)) } };
      }
      return f;
    });
    const hasSelectedSubclassFeatures = newFeatures.some(f => f.subclassShortName && normalizeSubclassName(f.subclassShortName) === selectedSubclassKey);
    const filteredFeatures = newFeatures.filter(f => {
      if (!f.subclassShortName) return !(hasSelectedSubclassFeatures && f.name.toLowerCase() === 'subclass feature');
      return normalizeSubclassName(f.subclassShortName) === selectedSubclassKey;
    }).map(f => {
      const resource = parseResourceInfo(f.description, { ...state.character, level: nextLevel }, { proficiencyBonus: profBonus, modifiers: {} });
      const tableMax = classResourceLimit(classEntry, nextLevel, f.name);
      if (resource) {
        resource.id = f.id;
        if (tableMax) resource.max = tableMax;
      }
      return { ...f, resource };
    });
    let updatedClasses = state.character.classes || [];
    if (updatedClasses.length === 0 && state.character.class) updatedClasses = [{ classId: state.character.class.toLowerCase(), level: state.character.level }];
    updatedClasses = updatedClasses.map((cls, idx) => idx === 0 ? { ...cls, level: nextLevel } : cls);
    const oldConBase = state.character.abilities.con || 10;
    const conBonus = state.character.backgroundChoices?.abilityAssignments?.con || 0;
    const oldConAsi = Object.entries(state.character.asiChoices || {}).reduce((total, [lvl, choice]: [string, any]) => total + (Number(choice.con) || 0), 0);
    const oldMod = Math.floor((oldConBase + conBonus + oldConAsi - 10) / 2);
    const newConAsi = oldConAsi + (nextAsiChoice.con || 0);
    const newMod = Math.floor((oldConBase + conBonus + newConAsi - 10) / 2);
    let retroactiveHp = newMod > oldMod ? (newMod - oldMod) * nextLevel : 0;
    const nextSpells = [...state.character.spells];
    const wizardSpellChoices = Object.entries(selections).filter(([id]) => id.includes('wizard-spells-') || id === 'wizard-savant-spells');
    const spellsCatalog = spellCatalog || state.spellsCatalog || [];
    wizardSpellChoices.forEach(([choiceId, selection]) => { selection.forEach(spellName => { const catalogSpell = spellsCatalog.find(s => s.name === spellName); if (catalogSpell && !nextSpells.some(s => s.name === spellName)) nextSpells.push({ ...catalogSpell, originKind: 'class', source: 'XPHB' }); }); });
    Object.entries(selections)
      .filter(([id]) => id.startsWith('class-cantrips-') || id.startsWith('class-prepared-spells-'))
      .forEach(([, selection]) => {
        selection.forEach(spellName => {
          const catalogSpell = spellsCatalog.find(s => s.name === spellName);
          if (catalogSpell && !nextSpells.some(s => s.name === spellName)) {
            nextSpells.push({ ...catalogSpell, originKind: 'class', source: 'XPHB' });
          }
        });
      });
    const nextFeatureSet = filterSelectedFeatures([...updatedExistingFeatures, ...filteredFeatures, ...nextFeatFeatures] as any, combinedSelections);
    for (const feature of nextFeatureSet as any[]) {
      for (const spellName of extractGrantedSpellNamesForLevel(feature, nextLevel)) {
        const catalogSpell = spellsCatalog.find(s => s.name === spellName);
        if (catalogSpell && !nextSpells.some(s => s.name === spellName)) {
          nextSpells.push({
            ...catalogSpell,
            originKind: 'feature',
            originName: feature.name,
            source: 'XPHB',
            spellcastingAbility: classEntry?.spellcastingAbility,
          });
        }
      }
    }
    return {
      character: {
        ...state.character,
        level: nextLevel,
        classes: updatedClasses,
        maxHp: state.character.maxHp + hpGain + retroactiveHp,
        hp: state.character.hp + hpGain + retroactiveHp,
        features: nextFeatureSet,
        spells: nextSpells,
        resources: syncResourcesWithFeatures(state.character.resources || {}, nextFeatureSet),
        asiChoices: { ...state.character.asiChoices, [nextLevel]: nextAsiChoice },
        classFeatureChoices: { ...state.character.classFeatureChoices, ...selections }
      },
      pendingLevelUp: null
    };
  }),

  levelUp: async () => {
    const { character } = get();
    const hpGain = 5; // Placeholder
    set((state) => ({ character: { ...state.character, level: state.character.level + 1, maxHp: state.character.maxHp + hpGain, hp: state.character.hp + hpGain } }));
  },

  resetLevel: () => set((state) => ({ character: { ...state.character, level: 1, hp: state.character.maxHp, features: state.character.features.filter(f => f.kind !== 'class') } })),

  resolveChoice: (choiceId) => set((state) => ({ character: { ...state.character, pendingChoices: state.character.pendingChoices.filter(c => c.id !== choiceId) } })),

  applyShortRest: () => set((state) => ({
    character: {
      ...state.character,
      ...(state.character.class?.toLowerCase() === 'wizard' ? { _needsPreparation: false } : {}),
      features: state.character.features.map(f => {
        if (!f.resource) return f;
        const label = (f.resource.recoveryLabel || '').toLowerCase();
        if (!label.includes('short') && !label.includes('curto')) return f;
        if (f.resource.recovery === 'inc') return { ...f, resource: { ...f.resource, remaining: Math.min(f.resource.max, f.resource.remaining + (f.resource.recoveryAmount || 1)) } };
        return { ...f, resource: { ...f.resource, remaining: f.resource.max } };
      }),
      spells: state.character.spells.map(s => {
        if (!s.resource) return s;
        const label = (s.resource.recoveryLabel || '').toLowerCase();
        if (label.includes('short') || label.includes('curto')) return { ...s, resource: { ...s.resource, remaining: s.resource.max } };
        return s;
      })
    }
  })),

  applyLongRest: (maxHp) => set((state) => ({
    character: {
      ...state.character,
      hp: maxHp, tempHp: 0, hitDiceUsed: 0,
      ...(state.character.class?.toLowerCase() === 'wizard' ? { _needsPreparation: true } : {}),
      features: state.character.features.map(f => f.resource ? { ...f, resource: { ...f.resource, remaining: f.resource.max } } : f),
      spells: state.character.spells.map(s => s.resource ? { ...s, resource: { ...s.resource, remaining: s.resource.max } } : s),
      spellSlots: Object.fromEntries(Object.entries(state.character.spellSlots || {}).map(([lvl, slots]) => [lvl, { ...slots, used: 0 }]))
    }
  })),

  resetCharacter: () => set({ character: createDefaultCharacter(), activeCharacterId: null }),
}));

if (typeof window !== 'undefined') { (window as any).useCharacterStore = useCharacterStore; }
