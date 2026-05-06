# Background Selection: Acolyte & Soldier (D&D 5.5e 2024)

Date: 2026-05-06

## Context

Implement full background selection for **Acolyte** and **Soldier** from the 2024 Player's Handbook (XPHB) with:
- Skill proficiencies
- Tool proficiencies
- Ability score suggestions
- Feats (Magic Initiate / Savage Attacker)
- Magic Initiate spell choices (Cleric)
- Equipment selection (A/B choice)
- 5etools data integration

## Architecture

```
src/
├── lib/background/              # NEW: Background processing module
│   ├── index.ts                 # Public API exports
│   ├── loader.ts                # Loads from 5etools JSON
│   ├── parser.ts                # Parses XPHB background structure
│   ├── types.ts                 # TypeScript types for backgrounds
│   ├── ability-calculator.ts     # Background ability score logic
│   ├── equipment-service.ts     # Equipment selection (A/B choice)
│   └── migrations.ts           # Safe migration from existing data
```

## Data Source

5etools `data/backgrounds.json` - XPHB entries filtered by:
- source: "XPHB"
- basicRules2024: true

## Core Types

```typescript
// src/lib/background/types.ts

export interface BackgroundAbilityChoice {
  abilities: string[];
  weights: number[];
}

export interface BackgroundFeat {
  name: string;
  source: string;
  spellList?: string;  // For Magic Initiate
}

export interface BackgroundEquipmentItem {
  name: string;
  displayName?: string;
  quantity?: number;
  value?: number;  // Gold piece value
  equipmentType?: string;
}

export interface BackgroundEquipmentOption {
  id: 'A' | 'B';
  items: BackgroundEquipmentItem[];
  goldFallback?: number;
}

export interface Background {
  name: string;
  source: string;
  page: number;
  abilityChoices: BackgroundAbilityChoice[];
  feats: BackgroundFeat[];
  skillProficiencies: string[];
  toolProficiencies: string[];
  equipment: BackgroundEquipmentOption[];
  entries: Entry[];
}

export interface AbilitySuggestion {
  ability: string;
  weight: number;
  isRecommended: boolean;
}
```

## API Interface

```typescript
// src/lib/background/index.ts

export function loadBackground(name: string): Background | null;
export function getBackgroundAbilitySuggestions(bg: Background): AbilitySuggestion[];
export function getSkillProficiencies(bg: Background): string[];
export function getToolProficiencies(bg: Background): string[];
export function getFeats(bg: Background): BackgroundFeat[];
export function getEquipmentOptions(bg: Background): EquipmentChoice[];
```

## Background Data (from 5etools XPHB)

### Acolyte

| Field | Value |
|-------|-------|
| Ability | INT/WIS/CHA (weights: 2,1,1) |
| Feat | Magic Initiate (Cleric) - 2 cantrips, 1 level 1 spell |
| Skills | Insight, Religion |
| Tools | Calligrapher's Supplies |
| Equipment A | Book (Prayers), Calligrapher's Supplies, Holy Symbol, Parchment (10), Robe, 8 GP |
| Equipment B | 50 GP |

### Soldier

| Field | Value |
|-------|-------|
| Ability | STR/DEX/CON (weights: 2,1,1) |
| Feat | Savage Attacker |
| Skills | Athletics, Intimidation |
| Tools | One Gaming Set (choice) |
| Equipment A | Spear, Shortbow, Arrows (20), Gaming Set, Healer's Kit, Quiver, Traveler's Clothes, 14 GP |
| Equipment B | 50 GP |

## Integration Points

### app.js Changes

1. **Replace stub functions** (lines 3987-4031):
   - `backgroundSkillProficiencies(background)` → call `getSkillProficiencies()`
   - `backgroundSpellChoiceRules()` → parse Magic Initiate feat
   - `backgroundSpellOptions(spellList)` → delegate to character spell system
   - `backgroundSelectedSpellNames()` → return selected spell names

2. **Equipment integration**:
   - Add equipment choice step after background selection
   - Use `getEquipmentOptions()` to render A/B choice

3. **Ability suggestions**:
   - After background selection, highlight recommended abilities
   - Non-blocking: just visual suggestions

## Migration Safety

```typescript
export function migrateFromLegacy(legacyBackground: any): Background | null {
  // Check if legacy format matches known backgrounds
  if (legacyBackground.entries?.some(e =>
    JSON.stringify(e).toLowerCase().includes('magic initiate')
  )) {
    return loadBackground(legacyBackground.name);
  }
  return null;
}
```

## Files to Create/Modify

### New Files
- `src/lib/background/types.ts`
- `src/lib/background/loader.ts`
- `src/lib/background/parser.ts`
- `src/lib/background/ability-calculator.ts`
- `src/lib/background/equipment-service.ts`
- `src/lib/background/migrations.ts`
- `src/lib/background/index.ts`

### Modify
- `src/types/background.ts` - Add entry types
- `app.js` - Wire up functions, add equipment choice UI

## Testing

1. Unit tests for parser with sample XPHB data
2. Integration test: select Acolyte → verify skills, feats, spell choices
3. Equipment A/B choice persists correctly
4. Legacy data migration works for non-XPHB backgrounds

## Status

- [x] Design approved
- [ ] Implementation plan created
- [ ] Code implemented
- [ ] Tested