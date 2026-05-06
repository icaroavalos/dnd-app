# FastAPI Backend Refactor Design

## Context

This project is currently a static web application with a large `app.js` file that mixes UI behavior, local data loading, domain rules, and derived character calculations. The user wants to refactor the backend-related parts of the project from JavaScript to Python, while preserving the current frontend as a consumer.

The refactor scope for this phase includes only:

- `data/`
- `scripts/`
- `src/core/`

The embedded `5etools-v2.28.0/` directory is explicitly out of scope and must remain unchanged in this phase. It is treated as a reference/source repository only.

## Goals

- Move backend-oriented logic from JavaScript to Python.
- Use FastAPI as the HTTP interface for the frontend.
- Preserve the current frontend and have it consume the new backend.
- Create stronger architectural boundaries between API, domain logic, services, and data access.
- Keep the system ready for future persistence without implementing database storage yet.
- Cover the full surface needed by the current frontend, not only a partial subset.

## Non-Goals

- No refactor of `5etools-v2.28.0/`.
- No frontend rewrite in this phase.
- No database integration in this phase.
- No migration of browser `localStorage` to server persistence in this phase.
- No commitment to a production deployment topology yet.

## Proposed Architecture

The backend will be introduced as a Python package under `backend/`.

### Directory Layout

```text
backend/
  app/
    main.py
    api/
      routes/
      schemas/
      dependencies/
    domain/
      character/
      engine/
      rules/
      models/
    services/
    infrastructure/
      repositories/
      loaders/
      cache/
      persistence/
  scripts/
  tests/
```

### Layer Responsibilities

#### `app/api`

Responsible for FastAPI routing, request/response schemas, dependency injection, and HTTP error translation.

This layer must not implement game rules directly.

#### `app/domain`

Responsible for pure business logic translated from `src/core`, including:

- character projection
- modifier derivation
- formula evaluation
- action derivation
- rule atom normalization and validation
- rule repository behavior

This layer must not depend on FastAPI, filesystem details, or future database storage.

#### `app/services`

Responsible for orchestration and use cases, including:

- loading ruleset catalogs
- preparing API responses
- deriving full character projections
- deriving available actions
- exposing capabilities and manifests

This layer coordinates domain + infrastructure.

#### `app/infrastructure`

Responsible for reading local JSON data, caching loaded datasets, implementing repository adapters, and defining persistence extension points for later.

This layer is also where Python replacements for the current JavaScript scripts will live conceptually, though executable tooling will be placed under `backend/scripts/`.

## Mapping from Current Project

### `src/core/`

Current JavaScript modules in `src/core` already provide a useful domain seed:

- `character/character-projection.js`
- `engine/action-engine.js`
- `engine/expression-evaluator.js`
- `engine/modifier-engine.js`
- `rules/rule-repository.js`
- `rules/rule-schema.js`

These should be translated into Python and reorganized inside `backend/app/domain/`.

### `scripts/`

Current scripts:

- `scripts/build-5etools-data.mjs`
- `scripts/sync-data.mjs`

These should be rewritten in Python and moved to `backend/scripts/`, keeping the same purpose:

- compacting 5etools-derived data for app use
- syncing external/open datasets into `data/`

### `data/`

The `data/` directory remains the runtime data source for this phase. The backend reads from it as local structured content.

The backend must treat `data/5etools/...`, `data/5e-2014/...`, `data/5e-2024/...`, and `data/supplements/...` as data sources, not code.

## API Surface

The API should cover the complete set of backend responsibilities currently used by the frontend.

### Catalog and Data Endpoints

- `GET /api/health`
- `GET /api/capabilities`
- `GET /api/manifest`
- `GET /api/rulesets`
- `GET /api/rulesets/{ruleset}/classes`
- `GET /api/rulesets/{ruleset}/subclasses`
- `GET /api/rulesets/{ruleset}/races`
- `GET /api/rulesets/{ruleset}/subraces`
- `GET /api/rulesets/{ruleset}/backgrounds`
- `GET /api/rulesets/{ruleset}/equipment`
- `GET /api/rulesets/{ruleset}/feats`
- `GET /api/rulesets/{ruleset}/spells`
- `GET /api/rulesets/{ruleset}/class-spells`
- `GET /api/rulesets/{ruleset}/features`
- `GET /api/rulesets/{ruleset}/rule-atoms`

### Character Calculation Endpoints

- `POST /api/characters/project`
- `POST /api/characters/actions`
- `POST /api/characters/validate`
- `POST /api/formulas/evaluate`

## Data Flow

1. The frontend requests catalogs or manifests from FastAPI.
2. FastAPI delegates to services.
3. Services use infrastructure repositories/loaders to read the local JSON datasets.
4. Repositories optionally cache parsed results in memory.
5. When the frontend submits a character payload, the backend uses domain modules to derive sheet projection, modifiers, formulas, and actions.
6. The backend returns stable JSON contracts designed for frontend consumption.

## Persistence Strategy

Persistence is intentionally deferred.

However, the design must remain ready for future server-side storage by introducing an abstraction boundary now, for example:

- `CharacterStore` interface/protocol in `backend/app/infrastructure/persistence/`

For this phase:

- the frontend remains responsible for `localStorage`
- the backend remains stateless for character persistence
- the API should expose capability metadata indicating that persistence is not yet server-backed

This prevents the current decision from blocking a later move to SQLite, PostgreSQL, or another storage mechanism.

## Error Handling

Use a consistent error response structure with fields such as:

- `code`
- `message`
- `details`
- `trace_id`

Recommended status usage:

- `400` for malformed payloads
- `404` for missing rulesets/resources
- `422` for structurally valid but semantically invalid character/rule combinations
- `500` for unexpected server/infrastructure failures

## Testing Strategy

### Domain Tests

Pure tests for:

- formula evaluation
- modifier normalization and totals
- character projection
- action derivation
- rule validation and repository indexing

### Service Tests

Tests for:

- dataset loading
- ruleset-specific composition
- projection orchestration
- feature and spell lookup behavior

### API Tests

Tests using FastAPI's test client for:

- endpoint contracts
- validation behavior
- error payload structure
- health/capability behavior

Fixtures should include representative character payloads and sample data slices derived from the current app behavior.

## Migration Strategy

A staged migration is recommended.

### Stage 1

Create the Python backend skeleton, schemas, data loaders, and health/capabilities endpoints.

### Stage 2

Port `src/core` JavaScript logic into Python domain modules with tests.

### Stage 3

Port `scripts/*.mjs` into Python tooling under `backend/scripts/`.

### Stage 4

Expose complete catalog endpoints backed by local `data/`.

### Stage 5

Expose character projection, validation, and action endpoints.

### Stage 6

Adapt the frontend to consume the FastAPI backend while preserving browser-side persistence.

## Risks and Constraints

- The current `app.js` is large and likely contains hidden business rules not yet isolated in `src/core`.
- Some current frontend-derived behavior may need to be identified and moved server-side during implementation.
- Data shape inconsistencies across `data/` sources may require normalization adapters.
- The absence of Git metadata in the current folder means the usual spec commit step cannot be completed here unless the project is later initialized as a Git repository.

## Recommendation

Proceed with FastAPI as the API layer and pure Python domain modules as the core of the refactor.

This gives the cleanest migration path from the current mixed JavaScript architecture to a backend that is easier to test, easier to evolve, and ready for future persistence without prematurely committing to a database.

## Spec Review Notes

Self-review completed:

- No placeholder sections remain.
- The architecture, API, and migration stages are aligned.
- Persistence is explicitly deferred but supported by design.
- Scope remains limited to `data/`, `scripts/`, and `src/core/`, excluding `5etools-v2.28.0/`.
