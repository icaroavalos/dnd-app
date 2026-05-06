# TypeScript State Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o estado global e funções de character para TypeScript, criando uma base tipada que melhora a manutenibilidade e previne erros.

**Architecture:** 
1. Criar tipos TypeScript para todo o estado (`AppState`, `Character`, `ApiState`)
2. Extrair funções "puras" do `app.js` para módulos TypeScript
3. Manter `app.js` híbrido durante a transição, importando funções tipadas
4. Usar type inference para guiar migrações futuras

**Tech Stack:** TypeScript 5.x, ES Modules (mantendo compatibilidade com build atual)

---

## File Structure

### Files to Create
- `src/types/state.ts` - Tipos principais (AppState, Character, ApiState)
- `src/types/index.ts` - Re-export de todos os tipos
- `src/core/state/state-manager.ts` - Gerenciamento de estado + persistência
- `src/core/character/character-abilities.ts` - Cálculos de ability scores
- `src/core/character/character-skills.ts` - Skills e proficiencies
- `src/core/character/character-equipment.ts` - Equipment choices
- `src/core/character/character-asi.ts` - Ability Score Improvements
- `src/core/character/index.ts` - Exports do character

### Files to Modify
- `src/types/character.ts` - Expandir tipos existentes
- `app.js` - Importar funções migradas ( gradual )

---

## Task 1: Definir Tipos Fundamentais

**Files:**
- Create: `src/types/state.ts`
- Modify: `src/types/character.ts`

- [ ] **Step 1: Criar tipos básicos em `src/types/state.ts`**

```typescript
/**
 * Tipos para o estado global da aplicação
 * Baseado na estrutura atual do app.js
 */

import type { SpellDetail } from './character';

/**
 * Dados da API/5etools
 */
export interface ApiState {
  classes: Record<string, ClassData>;
  levels: Record<string, unknown>;
  races: Record<string, RaceData>;
  spells: string[];
  classSpells: Record<string, { name: string; level: number; source: string }[]>;
  spellDetails: Record<string, SpellDetail>;
  source: {
    classOptions: [string, string][];
    raceOptions: [string, string][];
    backgroundOptions: [string, string][];
    backgroundDetails: Record<string, BackgroundData>;
    subraceDetails: Record<string, RaceData>;
    itemDetails: Record<string, ItemData>;
    classFeatures: FeatureData[];
    subclasses: SubclassData[];
    featDetails: Record<string, FeatureData>;
  };
}

/**
 * Estado do character (app.js:207-242)
 */
export interface Character {
  name: string;
  class: string;
  level: number;
  race: string;
  subrace: string;
  background: string;
  alignment: string;
  experience: number;
  abilityMethod: 'standard' | 'pointBuy' | 'manual';
  classFeatureChoices: Record<string, string[]>;
  asiChoices: Record<string, string[]>;
  equipmentChoices: Record<string, string>;
  inventory: string[];
  equippedItems: string[];
  hitDiceUsed: number;
  spellSlots: Record<string, number>;
  resources: Record<string, unknown>;
  tempHp: number;
  creationComplete: boolean;
  hp: number;
  armorClass: number;
  speed: number;
  abilities: AbilityScores;
  savingThrows: string[];
  classSkillChoices: string[];
  skillProficiencies: string[];
  attacks: Attack[];
  spells: string[];
  notes: string;
  bgSpellChoices?: Record<string, string[]>;
}

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Attack {
  name: string;
  range: string;
  type: string;
  damage: string;
}

/**
 * Estado da UI
 */
export interface UiState {
  step: 'lineage' | 'abilities' | 'choices' | 'leveling';
  tab: string;
  builderVisible: boolean;
  levelUpMode: boolean;
  levelUpFrom: number;
  levelUpHpBase: number;
  levelUpHpGain: number;
  levelUpSnapshot: Character | null;
  levelUpClassMode: 'same' | 'multiclass';
  hpModalOpen: boolean;
  hpModalMode: 'damage' | 'heal' | 'temp';
  hpModalAmount: number;
  restModalOpen: boolean;
  restModalType: 'short' | 'long' | null;
  restModalContent: unknown;
  validationMessage: string;
}

/**
 * Estado completo da aplicação
 */
export interface AppState {
  step: string;
  tab: string;
  dataStatus: 'local' | 'remote';
  derived: unknown;
  selectedSpell: string;
  actionFilter: string;
  selectedAction: string;
  featureFilter: string;
  selectedFeature: string;
  bgSpellChoices: Record<string, string[]>;
  api: ApiState;
  character: Character;
  // UI states
  builderVisible: boolean;
  levelUpMode: boolean;
  levelUpFrom: number;
  levelUpHpBase: number;
  levelUpHpGain: number;
  levelUpSnapshot: Character | null;
  levelUpClassMode: string;
  hpModalOpen: boolean;
  hpModalMode: string;
  hpModalAmount: number;
  restModalOpen: boolean;
  restModalType: string | null;
  restModalContent: unknown;
  validationMessage: string;
  activeCharacterId: string;
  characters: Character[];
}
```

- [ ] **Step 2: Adicionar tipos auxiliares em `src/types/character.ts`**

```typescript
// Adicionar ao arquivo existente:

export interface ClassData {
  name: string;
  source: string;
  hitDie: number;
  proficiency: string[];
  savingThrows: string[];
  spellcastingAbility?: string;
  casterProgression?: number;
  cantripProgression: number[];
  preparedSpellsProgression: number[][];
  startingProficiencies: {
    skills?: { choose: { from: string[]; count: number } };
  };
  proficiency_choices?: ProficiencyChoice[];
}

export interface ProficiencyChoice {
  choose: number;
  from: string[];
  type: string;
}

export interface RaceData {
  name: string;
  source: string;
  ability: Partial<AbilityScores>;
  traits: TraitData[];
}

export interface TraitData {
  name: string;
  entries: string[];
}

export interface BackgroundData {
  name: string;
  source: string;
  skillProficiencies: string[];
  toolProficiencies?: string[];
  languages?: string[];
  equipment: string[];
  feature: {
    name: string;
    entries: string[];
  };
}

export interface ItemData {
  name: string;
  source: string;
  type: string;
  value: number;
  weight: number;
}

export interface FeatureData {
  name: string;
  source: string;
  className: string;
  classSource: string;
  level: number;
  category: string;
  ability: string[];
  prerequisite: unknown;
  type: string;
  entries: string[];
}

export interface SubclassData {
  name: string;
  className: string;
  source: string;
  features: FeatureData[];
}
```

### Expected Output
- Tipos TypeScript para todo o estado
- Zero erros de compilação (mesmo sem implementação)

---

## Task 2: Migrar State Manager

**Files:**
- Create: `src/core/state/state-manager.ts`
- Create: `src/core/state/index.ts`

- [ ] **Step 1: Criar funções de load/save em TypeScript**

```typescript
import type { AppState, Character } from '../../types/state';

const STATE_KEY = 'dnd-character-state';

/**
 * Carrega estado do localStorage ou retorna estado padrão
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
```

- [ ] **Step 2: Criar index exports**

```typescript
// src/core/state/index.ts
export * from './state-manager';
```

### Expected Output
- Funções loadState, saveState, createDefaultCharacter tipadas
- Testes passam (se houver testes)

---

## Task 3: Migrar Funções de Ability Score

**Files:**
- Create: `src/core/character/character-abilities.ts`
- Create: `src/core/character/index.ts`

- [ ] **Step 1: Migrar cálculo de ability modifier**

```typescript
import type { AbilityScores } from '../../types/state';

/**
 * Calcula modifier para um ability score
 * Fórmula: floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calcula todos os modifiers
 */
export function calculateAllModifiers(
  abilities: AbilityScores
): Record<keyof AbilityScores, number> {
  return {
    str: calculateModifier(abilities.str),
    dex: calculateModifier(abilities.dex),
    con: calculateModifier(abilities.con),
    int: calculateModifier(abilities.int),
    wis: calculateModifier(abilities.wis),
    cha: calculateModifier(abilities.cha),
  };
}

/**
 * Calcula total de um saving throw com proficiência
 */
export function calculateSavingThrow(
  ability: keyof AbilityScores,
  score: number,
  isProficient: boolean
): number {
  const modifier = calculateModifier(score);
  const proficiencyBonus = isProficient ? 2 : 0; // Simplificado - idealmente do level
  return modifier + proficiencyBonus;
}

/**
 * Point Buy cost para um score
 */
export const POINT_BUY_COSTS = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
} as const;

export const POINT_BUY_BUDGET = 27;

/**
 * Calcula custo point buy para um array de scores
 */
export function calculatePointBuyCost(scores: number[]): number {
  return scores.reduce((total, score) => {
    const cost = POINT_BUY_COSTS[score as keyof typeof POINT_BUY_COSTS] ?? 0;
    return total + cost;
  }, 0);
}

/**
 * Valida se scores são válidos para point buy
 */
export function isValidPointBuy(
  scores: number[],
  budget: number = POINT_BUY_BUDGET
): boolean {
  const cost = calculatePointBuyCost(scores);
  return cost === budget;
}

/**
 * Standard array default
 */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
```

### Test File: `src/core/character/character-abilities.test.ts`

```typescript
import {
  calculateModifier,
  calculateAllModifiers,
  calculatePointBuyCost,
  isValidPointBuy,
  STANDARD_ARRAY,
  POINT_BUY_BUDGET,
} from './character-abilities';

describe('calculateModifier', () => {
  it('returns 0 for score 10', () => {
    expect(calculateModifier(10)).toBe(0);
  });

  it('returns positive modifier for score > 10', () => {
    expect(calculateModifier(14)).toBe(2);
    expect(calculateModifier(16)).toBe(3);
  });

  it('returns negative modifier for score < 10', () => {
    expect(calculateModifier(8)).toBe(-1);
    expect(calculateModifier(6)).toBe(-2);
  });
});

describe('calculatePointBuyCost', () => {
  it('calculates cost for standard array', () => {
    expect(calculatePointBuyCost(STANDARD_ARRAY)).toBe(27);
  });

  it('returns 0 for all 8s', () => {
    expect(calculatePointBuyCost([8, 8, 8, 8, 8, 8])).toBe(0);
  });
});

describe('isValidPointBuy', () => {
  it('validates standard array', () => {
    expect(isValidPointBuy(STANDARD_ARRAY)).toBe(true);
  });

  it('rejects over budget', () => {
    expect(isValidPointBuy([15, 15, 15, 15, 15, 15])).toBe(false);
  });
});
```

- [ ] **Step 2: Export no index**

```typescript
// src/core/character/index.ts
export * from './character-abilities';
// export * from './character-skills';
// export * from './character-equipment';
// export * from './character-asi';
```

### Expected Output
- Funções de ability com types
- Testes passando
- Imports funcionando em app.js

---

## Task 4: Atualizar imports no app.js

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Adicionar imports das funções TypeScript**

```javascript
// app.js - top do arquivo
import {
  calculateModifier,
  calculateAllModifiers,
  calculatePointBuyCost,
  isValidPointBuy,
  STANDARD_ARRAY,
  POINT_BUY_BUDGET,
} from './dist/src/core/character/character-abilities.js';

import {
  loadState,
  saveState,
  createDefaultCharacter,
} from './dist/src/core/state/state-manager.js';
```

- [ ] **Step 2: Substituir calls de funções migradas**

```javascript
// Antes:
const modifier = Math.floor((score - 10) / 2);

// Depois:
const modifier = calculateModifier(score);
```

### Expected Output
- app.js importa funções TypeScript
- Aplicação funciona normalmente

---

## Test Strategy

1. **Compile check:** `npm run build` deve passar sem errors
2. **Runtime check:** Abrir app e verificar se carrega
3. **Smoke test:** Criar character, subir level, salvar spells
4. **Regression:** Testar Magic Initiate fix (deve continuar funcionando)

## Rollback Plan

Se algo quebrar:
1. Reverter `app.js` para versão anterior
2. Remover imports TypeScript
3. Seguir usando versão JS

## Dependencies

- Manter compatibilidade com build atual (tsc)
- Não remover código JS até validação completa
- Types devem ser "strict enough" mas não blocker
