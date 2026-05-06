# Background System Design Spec

**Date:** 2026-05-06
**Status:** Approved

## Overview

Implement a modular background selection system for D&D character creation. Backgrounds are loaded from the 5etools `backgrounds.json` data file, parsed into usable rules, and presented through a dedicated UI step in the character creation flow.

## Architecture

```
src/core/character/
├── background-loader.ts     # Load & cache backgrounds.json
├── background-parser.ts     # Parse raw 5etools data → rules
├── background-rules.ts      # Generate choice rules for UI
├── background-choices.ts   # Manage user selections
├── index.ts                 # Public exports
src/types/background.ts      # TypeScript types (already exist)
```

**Principle:** TypeScript owns data/logic, `app.js` renders via rules.

---

## 1. Types (src/types/background.ts)

Extend existing types:

```typescript
export interface AbilityChoice {
  scores: [AbilityName, AbilityName, AbilityName];
  increases: [number, number, number];  // e.g., [2, 1, 0] for +2/+1 or [1, 1, 1]
}

export interface EquipmentOption {
  type: "items" | "gold";
  items?: ItemWithQuantity[];
  goldValue?: number;
}

export interface BackgroundRule {
  id: string;
  name: string;
  type: "ability" | "skill" | "tool" | "equipment" | "spell";
  options: any[];
  required: number;
}
```

---

## 2. Loader (background-loader.ts)

```typescript
// Cache background data in module scope
let cachedData: RawBackground[] | null = null;

export async function loadBackgroundData(): Promise<RawBackground[]>
export function getAllBackgrounds(): RawBackground[]
export function getBackground(name: string, source: string): RawBackground | undefined
```

- Load on first access, cache thereafter
- Filter for XPHB sources by default
- Support lookup by name + source

---

## 3. Parser (background-parser.ts)

```typescript
export interface ParsedBackground {
  name: string;
  source: string;
  abilityScores: AbilityChoice[];
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number | string[];
  equipment: { optionA: EquipmentOption; optionB: EquipmentOption };
  feat: string | null;
  spells: { class: string; cantrips: number; level1: number } | null;
}

export function parseBackground(raw: RawBackground): ParsedBackground
```

**Parsing rules:**
- `ability[].choose.weighted.from` → extract ability options
- `ability[].choose.weighted.weights` → extract weights for hints
- `skillProficiencies` → flatten to string array
- `toolProficiencies` → flatten to string array
- `startingEquipment` → A/B options with item resolution and gold fallback
- `feats[]` → extract Magic Initiate details if present
- `languageProficiencies` → parse anyStandard count or specific languages

---

## 4. Rules (background-rules.ts)

```typescript
export function backgroundChoiceRules(backgroundName: string): BackgroundRule[]
```

Returns rules compatible with existing `renderChoice()` pattern:

| Rule Type | Field | Required |
|-----------|-------|----------|
| `ability` | Pick ability scores | 1 choice |
| `skill` | Pick from available skills | if choose > 0 |
| `tool` | Pick from available tools | if choose > 0 |
| `equipment` | Select A or B | 1 choice |
| `spell` | Magic Initiate options | handled separately |

---

## 5. Choices State (background-choices.ts)

```typescript
export interface BackgroundChoices {
  background: string | null;
  abilityChoice: { scores: string[]; increases: number[] } | null;
  skillChoices: string[];
  toolChoice: string | null;
  equipmentChoice: "A" | "B";
  spellcastingAbility: AbilityName | null;
  spells: { cantrips: string[]; level1: string[] };
}

export function getBackgroundChoices(): BackgroundChoices
export function setBackgroundChoice(key: string, value: any): void
export function resetBackgroundChoices(): void
export function applyToCharacter(char: Partial<CharacterState>): Partial<CharacterState>
```

- Store in `state.character.bgChoices` (persisted with save)
- `applyToCharacter()` merges background selections into character state

---

## 6. UI Integration (app.js)

### Step Order

```javascript
const STEPS = [
  "race", "class", "subclass", "background", "equipment",
  "ASI", "spells", "finalize"
];
```

### Background Step Rendering

```javascript
async function renderBackgroundStep(isFinalRender) {
  if (!state.character.class) {
    return renderPlaceholder("Selecione a classe primeiro");
  }

  const { backgroundChoiceRules, getBackgroundChoices, setBackgroundChoice, loadBackgroundData } = await import("./src/core/character/index.js");
  const backgrounds = await loadBackgroundData();
  const rules = state.character.bgChoices?.background
    ? backgroundChoiceRules(state.character.bgChoices.background)
    : [];

  // Render background selector if not selected
  // Render nested sub-steps for ability/skills/tools/equipment
  return renderBackgroundPanel(backgrounds, rules, isFinalRender);
}
```

### Validation

```javascript
function missingBackgroundChoices() {
  const choices = state.character.bgChoices;
  if (!choices?.background) return ["background"];
  // Check each rule for completion...
  return [...missingRules];
}
```

### Proceed Condition

Character can proceed from background step when:
1. Background selected
2. All required sub-choices made (ability, skills if applicable, equipment)

---

## 7. Magic Initiate (Acolyte)

When Acolyte selected:

1. Add `magic initiate; cleric|xphb` feat to `state.character.feats`
2. Spell choices handled by existing `bgSpellChoices` system
3. Spellcasting ability stored as: `bgSpellChoices["bg-magic-initiate-cleric"].spellcasting-ability`

---

## 8. Equipment Handling

### A/B Options

```javascript
function renderEquipmentChoice(optionA, optionB) {
  return `
    <div class="equipment-choice">
      <label>
        <input type="radio" name="equipment" value="A" ${choice === "A" ? "checked" : ""} />
        A: ${renderItems(optionA)}
      </label>
      <label>
        <input type="radio" name="equipment" value="B" ${choice === "B" ? "checked" : ""} />
        B: ${optionB.goldValue} GP
      </label>
    </div>
  `;
}
```

### Gold Fallback

When option B is gold-only, display currency selector after clicking.
Store as `gold` in character state for equipment step.

---

## 9. File Structure (Final)

```
src/
├── core/
│   └── character/
│       ├── background-loader.ts      # Data loading (5etools JSON)
│       ├── background-parser.ts      # Parse raw → structured
│       ├── background-rules.ts       # Generate UI rules
│       ├── background-choices.ts     # State management
│       ├── index.ts                  # Public API
├── types/
│   └── background.ts                 # Extended types
app.js                                # UI integration
```

---

## 10. Maintenance Principles

1. **Single responsibility** — Each file has one job
2. **No circular dependencies** — Loader → Parser → Rules → Choices (dag)
3. **Exports are public API** — Internal functions prefixed `_` or not exported
4. **Types drive implementation** — Define types first, then functions
5. **app.js is renderer only** — No background logic in app.js unless essential

---

## 11. Tasks

1. Create/update TypeScript types in `src/types/background.ts`
2. Create `background-loader.ts` — load and cache 5etools data
3. Create `background-parser.ts` — parse raw JSON to rules
4. Create `background-rules.ts` — generate rules for UI
5. Create `background-choices.ts` — manage selections
6. Export public API in `index.ts`
7. Add "background" step to creation flow in app.js
8. Render background selector and sub-steps
9. Wire validation and state persistence
10. Add Magic Initiate spell handling for Acolyte
11. Add unit tests for loader/parser