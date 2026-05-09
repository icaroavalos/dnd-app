# Backend Architecture

NestJS + Fastify backend for D&D 5e 2024 rules.

## Quick Start

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:3100` by default.

## Canonical Contracts

**Location:** `src/shared/contracts/`

This is the source of truth for backend types:

- `character.contract.ts` - CharacterRecord, inventory, resources, runtime state
- `derived-character-sheet.contract.ts` - Projected character output
- `derived-action.contract.ts` - Action derivation output
- `base.contract.ts` - Shared primitives (AbilityScoreMap, RulesetId)
- `background-choice.contract.ts` - Background selection state
- `spell-choice.contract.ts` - Spell selection state

Import from `@shared/contracts` to access canonical types. `src/domain/contracts/` is a legacy path and should not be used for new code.

## Rules Data Source

**Canonical source:** `data/5etools/5e-2024/` (at project root)

The backend reads compacted JSON files from this directory:

| File | Content |
|------|---------|
| `classes.json` | Class definitions with hit die, spellcasting ability |
| `equipment.json` | Weapons, armor, items with damage, properties |
| `spells.json` | Spell details (level, components, damage) |
| `class-spells.json` | Which spells each class gets |
| `backgrounds.json` | Background options |
| `feats.json` | Feat definitions |
| `races.json` | Lineages/species |
| `class-features.json` | Class features |
| `subclass-features.json` | Subclass features |

**Repository:** `src/modules/rules/rules.repository.ts`

The RulesRepository:
- Reads JSON files from the compacted dataset
- Caches results in memory (first request wins)
- Exposes `getCatalog(kind)` for modules to fetch rules

## Module Responsibilities

### `rules/` - Rules Data Access

**Purpose:** Provide read-only access to 5e rules data.

**Exports:**
- `RulesService.getCatalog(kind)` - Get a rules catalog by kind

**Catalog kinds:**
- `backgrounds` - Background options
- `classes` - Class definitions
- `spells` - Spell details
- `class-spells` - Class spell lists
- `species` - Races/lineages
- `items` - Equipment
- `features` - Combined class + subclass features
- `feats` - Feat definitions

**Key files:**
- `rules.service.ts` - Service layer
- `rules.repository.ts` - File reading + caching
- `contracts/rules-catalog-entry.ts` - Catalog types

---

### `characters/` - Character Projection

**Purpose:** Derive a complete character sheet from a CharacterRecord.

**Endpoint:** `POST /characters/project`

**Input:** `CharacterRecord` (canonical contract)

**Output:** `DerivedCharacterSheet` with:
- Level, proficiency bonus
- Ability scores + modifiers
- Saving throws, skill bonuses
- Armor Class (derived from equipped armor/shield)
- HP, current HP, temp HP
- Spellcasting (ability, attack bonus, save DC)
- Spell slots max per level
- Passive perception, initiative, speed

**Armor Class logic:**
- Light Armor (LA): AC = base + dex modifier
- Medium Armor (MA): AC = base + dex modifier (max +2)
- Heavy Armor (HA): AC = base only (no dex)
- No armor: AC = 10 + dex modifier
- Shields: Add shield AC bonus

**Key files:**
- `characters.service.ts` - Projection logic
- `characters.controller.ts` - HTTP endpoint
- `characters.module.ts` - Module definition

### `characters-storage/` and persistence - Partial

**Purpose:** Store and load character state.

**Current state:**
- `characters-storage` uses Prisma/SQLite through `PrismaCharacterRepository`.
- `characters-persistence` still uses JSON file storage through `backend/data/characters.json`.
- This is intentionally marked partial until one persistence path becomes canonical.

**Known contract gap:**
The Prisma repository shape does not yet fully match `CharacterRecord`. In particular, `state`, `resources`, `spellChoices`, `backgroundChoices`, `skillProficiencies`, `savingThrowProficiencies`, `attacks`, and `spells` need alignment before this slice is MVP-stable.

---

### `actions/` - Action Derivation

**Purpose:** Derive available actions from character state.

**Endpoint:** `POST /actions/derive`

**Input:** `CharacterRecord`

**Output:** `DerivedAction[]` - Array of:
- Basic actions (Attack, Dash, Dodge, Interact, Opportunity Attack)
- Two-Weapon Fighting (if eligible)
- Weapon attacks from equipped items
- Spell actions from spellChoices and class spells
- Resource actions (features, limited uses)

**Derivation rules:**
- Attacks from `character.attacks` (explicit) or `character.inventory` (derived)
- Finesse weapons use DEX if higher than STR
- Versatile weapons use d8 damage when wielded with two hands
- Ammunition weapons show remaining ammo count
- Weapons with `Ammunition` property disabled if no matching ammo
- Two-Handed weapons disabled if shield or off-hand item blocks
- Loading weapons require free hand to load

**Key files:**
- `actions.service.ts` - Derivation logic
- `actions.controller.ts` - HTTP endpoint
- `ammo-rules.ts` - Ammunition group resolution

---

### `resources/` - Resource Management

**Purpose:** Handle limited-use resource consumption and recovery.

**Endpoints:**
- `POST /resources/use` - Spend a resource
- `POST /resources/recover` - Recover resources (short/long rest)

**Input (use):**
- `character: CharacterRecord`
- `resourceId: string`
- `amount?: number`

**Input (recover):**
- `character: CharacterRecord`
- `recovery: 'short_rest' | 'long_rest'`

**Recovery behavior:**
- `short_rest`: Recovers resources with `recovery: 'short_rest'`
- `long_rest`: Recovers all resources + resets spell slots + resets hit dice

**Errors:**
- `RESOURCE_UNAVAILABLE` (409) - Not enough uses remaining
- `RESOURCE_NOT_FOUND` (404) - Resource doesn't exist

**Key files:**
- `resources.service.ts` - Business logic
- `resources.controller.ts` - HTTP endpoints

---

### `inventory/` - Inventory Operations

**Purpose:** Handle ammunition spending and recovery.

**Endpoints:**
- `POST /inventory/spend-ammo` - Spend ammunition
- `POST /inventory/recover-ammo` - Recover ammunition

**Input (spend-ammo):**
- `character: CharacterRecord`
- `weaponItemId: string`
- `amount?: number`

**Input (recover-ammo):**
- `character: CharacterRecord`
- `weaponItemId: string`
- `amount?: number`

**Ammunition logic:**
- Identifies ammo group by weapon type (bow, crossbow, sling)
- Sums equivalent inventory entries (e.g., `arrow` + `arrows-20`)
- Spends from single-item stacks first
- Creates new stack if no matching ammo exists (recover)
- Removes empty stacks after spending

**Errors:**
- `AMMO_UNAVAILABLE` (409) - Not enough ammunition

**Key files:**
- `inventory.service.ts` - Business logic
- `inventory.controller.ts` - HTTP endpoints
- `ammo-rules.ts` - Ammunition group resolution

---

### `health/` - Health Checks

**Purpose:** Application health and readiness probes.

**Endpoints:**
- `GET /health` - Returns status, app name, environment
- `GET /health/ready` - Confirms rules data is readable

**Key files:**
- `health.controller.ts` - Health endpoints

---

## API Endpoints Summary

| Method | Endpoint | Module | Description |
|--------|----------|--------|-------------|
| GET | `/health` | health | Health check |
| GET | `/health/ready` | health | Readiness check |
| GET | `/rules/:catalog` | rules | Get rules catalog |
| POST | `/characters/project` | characters | Project character sheet |
| POST | `/actions/derive` | actions | Derive actions |
| POST | `/resources/use` | resources | Spend resource |
| POST | `/resources/recover` | resources | Recover resources |
| POST | `/inventory/spend-ammo` | inventory | Spend ammo |
| POST | `/inventory/recover-ammo` | inventory | Recover ammo |

---

## Data Flow

```
Request
  │
  ▼
Controller (HTTP layer)
  │
  ▼
Service (business logic)
  │
  ├──► RulesService.getCatalog() ───► RulesRepository ───► data/5etools/5e-2024/*.json
  │
  └──► Domain logic using canonical contracts
       │
       ▼
Response (canonical output types)
```

---

## What's Implemented vs. Roadmap

**Implemented (canonical):**
- Character projection with AC, HP, spellcasting
- Action derivation for attacks, spells, resources
- Resource use/recovery with short/long rest semantics
- Ammunition spend/recover with stack management
- Rules data access for all 2024 catalogs
- Shared contracts in `src/shared/contracts`

**Implemented but partial:**
- Prisma/SQLite persistence
- Character storage endpoints
- Resource ledger events
- Resource read model projection

**Not yet implemented or not yet MVP-stable (roadmap):**
- Character creation/validation beyond projection
- Multi-class spell slot progression
- Complex condition handling
- Equipment management beyond ammo
- Rest mechanics beyond resource recovery
- Feature activation (beyond resource tracking)
- Canonical persistence boundary
- Fully green backend typecheck

---

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3100` | HTTP port |
| `HOST` | `0.0.0.0` | Host binding |
| `LOG_LEVEL` | `info` | Log level |
| `RULES_DATA_DIR` | `data/5etools/5e-2024` | Rules data path |

---

## Testing

```bash
npm test
```

Tests are in `test/` using Node's built-in test runner.

---

## Adding New Features

1. Define contracts in `src/shared/contracts/`
2. Add rules data access in `src/modules/rules/` if needed
3. Implement service logic in appropriate module
4. Add controller endpoint
5. Add tests in `test/`
