# Backend MVP And System Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the NestJS + Fastify backend as the canonical MVP for D&D 2024 rules, persistence, actions, resources, and frontend migration.

**Architecture:** Keep rules data read-only in `data/5etools/5e-2024/`, keep contracts in `backend/src/shared/contracts/`, and make Prisma the only canonical persistence path. Frontend migration stays incremental: catalog, projection, actions/resources, then character storage.

**Tech Stack:** NestJS, Fastify, TypeScript strict mode, Prisma with SQLite for local development, Node test runner, vanilla frontend with TypeScript modules.

---

## File Map

- `backend/src/shared/contracts/`: backend request/output/domain contracts.
- `backend/src/modules/rules/`: read-only 5etools compact catalog.
- `backend/src/modules/characters/`: projection and canonical character CRUD.
- `backend/src/modules/characters/ledger/`: resource event ledger and read model.
- `backend/src/modules/resources/`: pure resource spend/recover commands for `CharacterRecord`.
- `backend/src/modules/inventory/`: pure ammo spend/recover commands for `CharacterRecord`.
- `backend/src/modules/actions/`: derived combat/spell/resource actions.
- `backend/prisma/schema.prisma`: user-state persistence schema, never rules data.
- `src/lib/api-*.ts`: frontend API clients and fallback adapters.
- `docs/agents/`: task board and handoff rules for worker agents.

## Phase 0: Preflight For Every Worker

### Task 0: Read Context And Confirm Baseline

**Files:**
- Read: `docs/Architecture_memory.md`
- Read: `docs/preferences.md`
- Read: `docs/learnings.md`
- Read: `docs/agents/task-board.md`

- [ ] **Step 1: Check git state**

Run:

```bash
git status --short
```

Expected: note existing unrelated changes. Do not revert user changes.

- [ ] **Step 2: Run backend baseline**

Run:

```bash
cd backend
npm run typecheck
npm test
```

Expected today: `npm run typecheck` fails until Task 1 is complete; `npm test` passes.

- [ ] **Step 3: Update session log before editing**

Append a short entry to `docs/sessions.md` with timestamp, assigned task id, and baseline result.

## Phase 1: Make Backend Typecheck Green

### Task 1: Fix Backend Typecheck

**Files:**
- Modify: `backend/src/modules/characters/ledger/resource-projection.controller.ts`
- Modify: `backend/src/modules/characters/ledger/resource-projection.service.ts`
- Modify: `backend/test/characters.spec.ts`
- Modify: `backend/test/resources.spec.ts`
- Modify: `docs/sessions.md`

- [ ] **Step 1: Fix duplicate `characterId` in projection response**

In `ResourceProjectionController.rebuildProjection()`, replace the return with:

```ts
const result = await this.projectionService.projectCharacterResources(characterId);
return { ...result, projected: true };
```

- [ ] **Step 2: Fix read-model lookup**

In `ResourceProjectionService.getResources()`, replace:

```ts
where: { id: characterId },
```

with:

```ts
where: { characterId },
```

- [ ] **Step 3: Fix `BackgroundChoiceState` fixtures**

In every `backgroundChoices` object in `backend/test/characters.spec.ts` that has `backgroundId`, `abilityMode`, and `abilityAssignments`, add:

```ts
equipmentSelection: []
```

- [ ] **Step 4: Remove stale `@ts-expect-error`**

In `backend/test/resources.spec.ts`, find the unused `@ts-expect-error` near the reported line and remove it. If the test intended invalid runtime input, cast only the value under test:

```ts
amount: 'invalid' as unknown as number
```

- [ ] **Step 5: Verify**

Run:

```bash
cd backend
npm run typecheck
npm test
```

Expected: both commands exit `0`.

- [ ] **Step 6: Update session log**

Append command results to `docs/sessions.md`.

## Phase 2: Backend Package And Persistence Boundary

### Task 2: Make `backend/package.json` Standalone

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Modify: `backend/README.md`
- Test: `backend/package.json`

- [ ] **Step 1: Add missing backend dependencies**

Move or add these runtime dependencies to `backend/package.json`:

```json
{
  "@nestjs/common": "^11.1.19",
  "@nestjs/core": "^11.1.19",
  "@nestjs/platform-fastify": "^11.1.19",
  "@nestjs/testing": "^11.1.19",
  "fastify": "^5.8.5",
  "reflect-metadata": "^0.2.2",
  "rxjs": "^7.8.2",
  "supertest": "^7.2.2",
  "tsx": "^4.21.0",
  "typescript": "^5.9.3",
  "@types/node": "^25.6.2"
}
```

Keep Prisma packages in the backend package.

- [ ] **Step 2: Regenerate lockfile**

Run:

```bash
cd backend
npm install
```

Expected: `backend/package-lock.json` includes Nest/Fastify dependencies.

- [ ] **Step 3: Verify backend can run from backend directory**

Run:

```bash
cd backend
npm run typecheck
npm test
```

Expected: both pass after Task 1.

### Task 3: Choose Prisma As Canonical Persistence

**Files:**
- Modify: `backend/src/app.module.ts`
- Delete: `backend/src/modules/characters/characters-persistence.controller.ts`
- Delete: `backend/src/modules/characters/characters-persistence.module.ts`
- Delete: `backend/src/modules/characters/characters-persistence.service.ts`
- Delete: `backend/src/modules/characters/persistence/character-persistence.service.ts`
- Modify: `backend/src/modules/README.md`
- Modify: `backend/docs/architecture.md`
- Test: `backend/test/characters-persistence.spec.ts`

- [ ] **Step 1: Remove JSON persistence module from AppModule**

Remove this import:

```ts
import { CharactersPersistenceModule } from './modules/characters/characters-persistence.module.js';
```

Remove `CharactersPersistenceModule` from the `imports` array.

- [ ] **Step 2: Delete JSON persistence files**

Delete the four files listed above. Do not delete Prisma files.

- [ ] **Step 3: Retire JSON persistence tests**

Replace `backend/test/characters-persistence.spec.ts` with tests for the canonical Prisma `/characters` CRUD after Task 5, or delete it in the same commit that adds replacement coverage.

- [ ] **Step 4: Verify no JSON persistence imports remain**

Run:

```bash
rg -n "characters-persistence|CharacterPersistenceService|backend/data/characters" backend/src backend/test docs README.md
```

Expected: no matches under `backend/src`; matches under `docs/archive` are allowed.

## Phase 3: Canonical Character Storage

### Task 4: Persist Full `CharacterRecord` Snapshot In Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/modules/characters/persistence/prisma-character-repository.ts`
- Modify: `backend/test/characters-prisma-repository.spec.ts`
- Modify: `backend/prisma/seed.ts`

- [ ] **Step 1: Add canonical snapshot column**

In `model Character`, add:

```prisma
recordJson String @default("{}")
```

This stores the canonical `CharacterRecord` payload for MVP while relational tables remain available for later indexing.

- [ ] **Step 2: Create migration**

Run:

```bash
cd backend
npx prisma migrate dev --name add_character_record_snapshot
```

Expected: new migration under `backend/prisma/migrations/`.

- [ ] **Step 3: Update repository types**

Change `PrismaCharacterRepository` public methods to accept and return `CharacterRecord` from `@shared/contracts`.

Use this serializer:

```ts
private serializeRecord(character: CharacterRecord): string {
  return JSON.stringify(character);
}

private deserializeRecord(value: string): CharacterRecord {
  return JSON.parse(value) as CharacterRecord;
}
```

- [ ] **Step 4: Update create/update**

When creating or updating `Character`, write `recordJson: this.serializeRecord(character)`.

Keep `name`, `ruleset`, `lineageId`, `backgroundId`, `alignment`, and `experience` synchronized for list queries.

- [ ] **Step 5: Update findById**

When `recordJson` is present and not `{}`, return `this.deserializeRecord(character.recordJson)`.

- [ ] **Step 6: Verify**

Run:

```bash
cd backend
npm run typecheck
npm test -- test/characters-prisma-repository.spec.ts
```

Expected: repository tests pass and return canonical `CharacterRecord`.

### Task 5: Expose Canonical CRUD Under `/characters`

**Files:**
- Modify: `backend/src/modules/characters/storages/characters-storage.controller.ts`
- Modify: `backend/src/modules/characters/storages/characters-storage.service.ts`
- Modify: `backend/src/modules/characters/storages/characters-storage.module.ts`
- Modify: `backend/src/modules/characters/dto/create-character.dto.ts`
- Modify: `backend/src/modules/characters/dto/update-character.dto.ts`
- Test: `backend/test/characters-storage.spec.ts`

- [ ] **Step 1: Move storage controller route to `/characters`**

Change:

```ts
@Controller('characters-storage')
```

to:

```ts
@Controller('characters')
```

Keep existing projection endpoint `POST /characters/project` in `CharactersController`.

- [ ] **Step 2: Add full CRUD routes**

Controller must expose:

```ts
@Get()
@Get(':id')
@Post()
@Put(':id')
@Delete(':id')
```

The request body for create is `CreateCharacterDto`; update receives `CharacterRecord`.

- [ ] **Step 3: Update service to use Prisma repository only**

`CharactersStorageService` calls `PrismaCharacterRepository` for list, find, create, update, and delete.

- [ ] **Step 4: Verify route behavior**

Run:

```bash
cd backend
npm test -- test/characters-storage.spec.ts
npm run typecheck
```

Expected: CRUD tests pass and typecheck remains green.

## Phase 4: Resource Ledger Integration

### Task 6: Connect Ledger To Canonical Character Runtime State

**Files:**
- Modify: `backend/src/modules/characters/ledger/resource-ledger.service.ts`
- Modify: `backend/src/modules/characters/ledger/resource-projection.service.ts`
- Test: `backend/test/characters-resource-ledger.spec.ts`
- Test: `backend/test/characters-resource-projection.spec.ts`

- [ ] **Step 1: Add tests for projection read after rebuild**

Test sequence:

```ts
await request(app.getHttpServer()).post(`/characters/${characterId}/resources/hp`).send({
  amount: -3,
  currentHp: 10,
  source: 'damage'
});

await request(app.getHttpServer()).post(`/characters/${characterId}/resources/projection/rebuild`).send();

const response = await request(app.getHttpServer()).get(`/characters/${characterId}/resources/projection`);
assert.equal(response.body.characterId, characterId);
assert.equal(response.body.currentHp, 7);
```

- [ ] **Step 2: Ensure projection lookup uses `characterId`**

Keep the Task 1 fix in place.

- [ ] **Step 3: Apply the fixed event policy**

For MVP, ledger writes do not mutate `CharacterRecord.recordJson` directly. They update `ResourceReadModel`; projection consumers combine snapshot + read model.

- [ ] **Step 4: Verify**

Run:

```bash
cd backend
npm test -- test/characters-resource-ledger.spec.ts test/characters-resource-projection.spec.ts
npm run typecheck
```

Expected: ledger and projection tests pass.

## Phase 5: Frontend API Migration

### Task 7: Catalog API Client Default

**Files:**
- Modify: `src/lib/api-catalog-client.ts`
- Modify: `src/core/rules/rule-repository.ts`
- Test: `tests/rules-constants.test.js`

- [ ] **Step 1: Ensure catalog client can call backend**

Backend base URL comes from a single constant or localStorage flag. Default local backend:

```ts
const DEFAULT_BACKEND_URL = 'http://localhost:3100';
```

- [ ] **Step 2: Keep local fallback**

If backend fetch fails, keep reading `data/5etools/5e-2024/`.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
npm run typecheck
node --test tests/rules-constants.test.js
```

Expected: frontend still works without backend.

### Task 8: Projection, Actions, Resources, Inventory Clients

**Files:**
- Modify: `src/lib/api-character-project-client.ts`
- Modify: `src/lib/api-resource-mutations.ts`
- Modify: `src/lib/api-resource-adapter.ts`
- Modify: `src/core/character/character-projection.ts`
- Test: `tests/character-projection-helpers.test.js`
- Test: `tests/action-engine.test.js`

- [ ] **Step 1: Projection uses backend when enabled**

`character-projection.ts` calls `projectCharacter()` from `api-character-project-client.ts` when backend projection is enabled.

- [ ] **Step 2: Mutations use backend when enabled**

Resource use/recover and inventory ammo spend/recover call backend clients first, then fallback local.

- [ ] **Step 3: Verify frontend suite**

Run:

```bash
npm run build
npm run typecheck
node --check app.js
node --test tests/*.test.js
```

Expected: all local tests pass with backend disabled.

## Phase 6: User-Facing Feature Completion

### Task 9: Level-Up Feature Preview

**Files:**
- Modify: `src/core/state/builder-views.ts`
- Modify: `src/core/character/feature-engine.ts`
- Test: `tests/builder-views.test.js`
- Test: `tests/feature-engine.test.js`

- [ ] **Step 1: Add failing test**

Create a test where increasing Barbarian from level 18 to 19 shows the actual level 19 feature text instead of only `You gain the following benefits.`

- [ ] **Step 2: Fix feature detail resolution**

Read feature detail from compacted `class-features.json` first; only fallback to summary text when entries are absent.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
node --test tests/builder-views.test.js tests/feature-engine.test.js
```

Expected: level-up preview includes concrete feature details.

### Task 10: Spell Selection And Spell Tab Polish

**Files:**
- Modify: `src/core/state/spells-view.ts`
- Modify: `src/core/state/builder-views.ts`
- Modify: `styles.css`
- Test: `tests/spell-detail.test.js`
- Test: `tests/builder-views.test.js`

- [ ] **Step 1: Prevent automatic spell description open**

Initial spell tab state must have no selected spell unless user explicitly selects one.

- [ ] **Step 2: Add info icon in spell selection**

Use a compact text/icon button that opens spell card detail without selecting/casting the spell.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
node --test tests/spell-detail.test.js tests/builder-views.test.js
```

Expected: spell details open only by explicit interaction.

### Task 11: Background Equipment Completion

**Files:**
- Modify: `src/core/character/background-parser.ts`
- Modify: `src/core/character/background-choices.ts`
- Modify: `src/core/state/builder-views.ts`
- Test: `tests/background-parser.test.ts`
- Test: `tests/background-choices.test.ts`

- [ ] **Step 1: Add test with a 2024 background that grants multiple equipment entries**

Assert all entries are returned.

- [ ] **Step 2: Update parser and UI**

Parser returns full equipment list; builder view renders every granted item.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
node --test tests/background-parser.test.js tests/background-choices.test.js
```

Expected: all background equipment appears.

## Phase 7: Completion Criteria

### Task 12: MVP Acceptance Run

**Files:**
- Modify: `docs/sessions.md`
- Modify: `docs/Architecture_memory.md`
- Modify: `docs/agents/task-board.md`

- [ ] **Step 1: Run backend acceptance**

Run:

```bash
cd backend
npm run typecheck
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 2: Run frontend acceptance**

Run:

```bash
npm run build
npm run typecheck
node --check app.js
node --test tests/*.test.js
```

Expected: all pass.

- [ ] **Step 3: Update docs**

Mark MVP backend status in `docs/Architecture_memory.md` only after all acceptance commands pass.

- [ ] **Step 4: Update task board**

Mark completed tasks in `docs/agents/task-board.md`.

## Self-Review

- Spec coverage: backend stabilization, persistence, ledger, frontend migration, and UI feature completion are all mapped to tasks.
- Placeholder scan: no task depends on an undefined "later" step; each task has concrete files and commands.
- Type consistency: canonical contract path is `backend/src/shared/contracts/` and imports use `@shared/contracts`.
