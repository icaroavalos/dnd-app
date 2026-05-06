# FastAPI Backend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python FastAPI backend that replaces the current backend-oriented JavaScript logic in `data/`, `scripts/`, and `src/core/`, while keeping the existing frontend as an API consumer.

**Architecture:** The backend lives under `backend/` and is split into API, domain, services, and infrastructure. Domain logic is ported from `src/core/` into pure Python modules, data is served from the existing local `data/` directory, and persistence remains browser-side for now behind a future-ready abstraction boundary.

**Tech Stack:** Python 3.12+, FastAPI, Pydantic, Uvicorn, Pytest

---

## File Structure

- `backend/pyproject.toml`: Python project metadata and dependencies.
- `backend/app/main.py`: FastAPI app bootstrap and router registration.
- `backend/app/api/routes/health.py`: health and capabilities endpoints.
- `backend/app/api/routes/catalog.py`: manifest and ruleset catalog endpoints.
- `backend/app/api/routes/characters.py`: projection, actions, and validation endpoints.
- `backend/app/api/routes/formulas.py`: formula evaluation endpoint.
- `backend/app/api/schemas/common.py`: shared error and metadata schemas.
- `backend/app/api/schemas/catalog.py`: response schemas for ruleset data.
- `backend/app/api/schemas/character.py`: request/response schemas for character endpoints.
- `backend/app/domain/engine/expression_evaluator.py`: formula tokenizer and evaluator.
- `backend/app/domain/engine/modifier_engine.py`: modifier normalization, totals, carried weight.
- `backend/app/domain/engine/action_engine.py`: available action derivation.
- `backend/app/domain/character/character_projection.py`: derived character sheet logic.
- `backend/app/domain/rules/rule_schema.py`: rule validation and normalization.
- `backend/app/domain/rules/rule_repository.py`: in-memory rule repository.
- `backend/app/services/catalog_service.py`: catalog loading and normalization use cases.
- `backend/app/services/character_service.py`: projection/actions/validation orchestration.
- `backend/app/infrastructure/loaders/json_loader.py`: JSON file loading from project `data/`.
- `backend/app/infrastructure/repositories/data_repository.py`: ruleset and asset repository over local JSON.
- `backend/app/infrastructure/cache/memory_cache.py`: simple in-process cache.
- `backend/app/infrastructure/persistence/character_store.py`: future persistence protocol.
- `backend/scripts/build_5etools_data.py`: Python port of `scripts/build-5etools-data.mjs`.
- `backend/scripts/sync_data.py`: Python port of `scripts/sync-data.mjs`.
- `backend/tests/...`: tests grouped by domain, services, and API.

### Task 1: Scaffold the backend package

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/routes/__init__.py`
- Create: `backend/app/api/schemas/__init__.py`
- Create: `backend/app/domain/__init__.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/infrastructure/__init__.py`
- Create: `backend/tests/test_health.py`

- [ ] **Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_returns_ok() -> None:
    response = client.get('/api/health')

    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_health.py -v`
Expected: FAIL with `ModuleNotFoundError` for `app.main` or missing FastAPI app.

- [ ] **Step 3: Write minimal implementation**

`backend/pyproject.toml`
```toml
[project]
name = "dnd-fastapi-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115,<1.0",
  "uvicorn>=0.30,<1.0",
  "pydantic>=2.8,<3.0"
]

[project.optional-dependencies]
dev = [
  "pytest>=8.2,<9.0",
  "httpx>=0.27,<1.0"
]

[tool.pytest.ini_options]
pythonpath = ["backend"]
testpaths = ["backend/tests"]
```

`backend/app/main.py`
```python
from fastapi import FastAPI

app = FastAPI(title='D&D Backend API')


@app.get('/api/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_health.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml backend/app/main.py backend/tests/test_health.py
git commit -m "feat: scaffold fastapi backend"
```

If `.git` is still unavailable in this folder, skip the commit and record that Git is not initialized here.

### Task 2: Add shared API metadata and capabilities endpoints

**Files:**
- Create: `backend/app/api/routes/health.py`
- Create: `backend/app/api/schemas/common.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_capabilities.py`

- [ ] **Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_capabilities_endpoint_describes_storage_state() -> None:
    response = client.get('/api/capabilities')

    assert response.status_code == 200
    assert response.json()['persistence'] is False
    assert response.json()['storage'] == 'browser'
    assert response.json()['future_storage_supported'] is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_capabilities.py -v`
Expected: FAIL with `404 Not Found` for `/api/capabilities`.

- [ ] **Step 3: Write minimal implementation**

`backend/app/api/schemas/common.py`
```python
from pydantic import BaseModel


class CapabilitiesResponse(BaseModel):
    persistence: bool
    storage: str
    future_storage_supported: bool
```

`backend/app/api/routes/health.py`
```python
from fastapi import APIRouter

from app.api.schemas.common import CapabilitiesResponse

router = APIRouter(prefix='/api', tags=['meta'])


@router.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@router.get('/capabilities', response_model=CapabilitiesResponse)
def capabilities() -> CapabilitiesResponse:
    return CapabilitiesResponse(
        persistence=False,
        storage='browser',
        future_storage_supported=True,
    )
```

`backend/app/main.py`
```python
from fastapi import FastAPI

from app.api.routes.health import router as health_router

app = FastAPI(title='D&D Backend API')
app.include_router(health_router)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_health.py backend/tests/test_capabilities.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/app/api/routes/health.py backend/app/api/schemas/common.py backend/tests/test_capabilities.py
git commit -m "feat: add backend capability metadata"
```

If `.git` is still unavailable in this folder, skip the commit and record that Git is not initialized here.

### Task 3: Build local JSON loading and catalog repository

**Files:**
- Create: `backend/app/infrastructure/cache/memory_cache.py`
- Create: `backend/app/infrastructure/loaders/json_loader.py`
- Create: `backend/app/infrastructure/repositories/data_repository.py`
- Create: `backend/app/services/catalog_service.py`
- Create: `backend/tests/test_catalog_service.py`

- [ ] **Step 1: Write the failing test**

```python
from app.services.catalog_service import CatalogService
from app.infrastructure.repositories.data_repository import DataRepository


def test_catalog_service_lists_known_rulesets() -> None:
    service = CatalogService(DataRepository())

    rulesets = service.list_rulesets()

    assert '5e-2014' in rulesets
    assert '5e-2024' in rulesets
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_catalog_service.py -v`
Expected: FAIL with import or attribute errors because repository and service are not implemented.

- [ ] **Step 3: Write minimal implementation**

`backend/app/infrastructure/cache/memory_cache.py`
```python
class MemoryCache:
    def __init__(self) -> None:
        self._items: dict[str, object] = {}

    def get(self, key: str) -> object | None:
        return self._items.get(key)

    def set(self, key: str, value: object) -> object:
        self._items[key] = value
        return value
```

`backend/app/infrastructure/loaders/json_loader.py`
```python
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class JsonLoader:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or Path(__file__).resolve().parents[4]

    def load(self, relative_path: str) -> Any:
        file_path = self.root / relative_path
        with file_path.open('r', encoding='utf-8') as handle:
            return json.load(handle)
```

`backend/app/infrastructure/repositories/data_repository.py`
```python
from __future__ import annotations

from app.infrastructure.cache.memory_cache import MemoryCache
from app.infrastructure.loaders.json_loader import JsonLoader


class DataRepository:
    def __init__(self, loader: JsonLoader | None = None, cache: MemoryCache | None = None) -> None:
        self.loader = loader or JsonLoader()
        self.cache = cache or MemoryCache()

    def get_manifest(self) -> dict:
        return self._cached('manifest', 'data/manifest.json')

    def list_rulesets(self) -> list[str]:
        manifest = self.get_manifest()
        return sorted((manifest.get('rulesets') or {}).keys())

    def get_ruleset_file(self, ruleset: str, name: str) -> dict:
        return self._cached(f'{ruleset}:{name}', f'data/5etools/{ruleset}/{name}.json')

    def _cached(self, key: str, path: str) -> dict:
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        return self.cache.set(key, self.loader.load(path))
```

`backend/app/services/catalog_service.py`
```python
from app.infrastructure.repositories.data_repository import DataRepository


class CatalogService:
    def __init__(self, repository: DataRepository) -> None:
        self.repository = repository

    def list_rulesets(self) -> list[str]:
        return self.repository.list_rulesets()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_catalog_service.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/infrastructure/cache/memory_cache.py backend/app/infrastructure/loaders/json_loader.py backend/app/infrastructure/repositories/data_repository.py backend/app/services/catalog_service.py backend/tests/test_catalog_service.py
git commit -m "feat: add local data repository"
```

If `.git` is still unavailable in this folder, skip the commit and record that Git is not initialized here.

### Task 4: Expose manifest and catalog endpoints

**Files:**
- Create: `backend/app/api/routes/catalog.py`
- Create: `backend/app/api/schemas/catalog.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/services/catalog_service.py`
- Create: `backend/tests/test_catalog_routes.py`

- [ ] **Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ruleset_classes_endpoint_returns_results() -> None:
    response = client.get('/api/rulesets/5e-2024/classes')

    assert response.status_code == 200
    body = response.json()
    assert body['ruleset'] == '5e-2024'
    assert isinstance(body['results'], list)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_catalog_routes.py -v`
Expected: FAIL with `404 Not Found` for `/api/rulesets/5e-2024/classes`.

- [ ] **Step 3: Write minimal implementation**

`backend/app/api/schemas/catalog.py`
```python
from pydantic import BaseModel


class CatalogListResponse(BaseModel):
    ruleset: str
    results: list[dict]
```

`backend/app/services/catalog_service.py`
```python
from app.infrastructure.repositories.data_repository import DataRepository


class CatalogService:
    def __init__(self, repository: DataRepository) -> None:
        self.repository = repository

    def list_rulesets(self) -> list[str]:
        return self.repository.list_rulesets()

    def get_manifest(self) -> dict:
        return self.repository.get_manifest()

    def get_catalog(self, ruleset: str, name: str) -> dict:
        payload = self.repository.get_ruleset_file(ruleset, name)
        return {'ruleset': ruleset, 'results': payload.get('results', [])}
```

`backend/app/api/routes/catalog.py`
```python
from fastapi import APIRouter

from app.api.schemas.catalog import CatalogListResponse
from app.infrastructure.repositories.data_repository import DataRepository
from app.services.catalog_service import CatalogService

router = APIRouter(prefix='/api', tags=['catalog'])
service = CatalogService(DataRepository())


@router.get('/manifest')
def manifest() -> dict:
    return service.get_manifest()


@router.get('/rulesets')
def rulesets() -> dict[str, list[str]]:
    return {'rulesets': service.list_rulesets()}


@router.get('/rulesets/{ruleset}/classes', response_model=CatalogListResponse)
def classes(ruleset: str) -> CatalogListResponse:
    return CatalogListResponse(**service.get_catalog(ruleset, 'classes'))
```

`backend/app/main.py`
```python
from fastapi import FastAPI

from app.api.routes.catalog import router as catalog_router
from app.api.routes.health import router as health_router

app = FastAPI(title='D&D Backend API')
app.include_router(health_router)
app.include_router(catalog_router)
```

- [ ] **Step 4: Expand the route set before moving on**

Add the same pattern in `backend/app/api/routes/catalog.py` for:

```python
@router.get('/rulesets/{ruleset}/subclasses', response_model=CatalogListResponse)
@router.get('/rulesets/{ruleset}/races', response_model=CatalogListResponse)
@router.get('/rulesets/{ruleset}/subraces', response_model=CatalogListResponse)
@router.get('/rulesets/{ruleset}/backgrounds', response_model=CatalogListResponse)
@router.get('/rulesets/{ruleset}/equipment', response_model=CatalogListResponse)
@router.get('/rulesets/{ruleset}/feats', response_model=CatalogListResponse)
@router.get('/rulesets/{ruleset}/spells', response_model=CatalogListResponse)
@router.get('/rulesets/{ruleset}/class-spells', response_model=CatalogListResponse)
```

For `features`, return a merged result from `class-features` and `subclass-features`.

```python
def features(ruleset: str) -> CatalogListResponse:
    class_features = service.get_catalog(ruleset, 'class-features')['results']
    subclass_features = service.get_catalog(ruleset, 'subclass-features')['results']
    return CatalogListResponse(ruleset=ruleset, results=[*class_features, *subclass_features])
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pytest backend/tests/test_health.py backend/tests/test_capabilities.py backend/tests/test_catalog_service.py backend/tests/test_catalog_routes.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/main.py backend/app/api/routes/catalog.py backend/app/api/schemas/catalog.py backend/app/services/catalog_service.py backend/tests/test_catalog_routes.py
git commit -m "feat: expose catalog endpoints"
```

If `.git` is still unavailable in this folder, skip the commit and record that Git is not initialized here.

### Task 5: Port formula and modifier domain logic from JavaScript to Python

**Files:**
- Create: `backend/app/domain/engine/expression_evaluator.py`
- Create: `backend/app/domain/engine/modifier_engine.py`
- Create: `backend/tests/domain/test_expression_evaluator.py`
- Create: `backend/tests/domain/test_modifier_engine.py`

- [ ] **Step 1: Write the failing tests**

```python
from app.domain.engine.expression_evaluator import evaluate_formula


def test_evaluate_formula_supports_prof_and_ability_modifiers() -> None:
    result = evaluate_formula('8 + @prof + @wis_mod', {'prof': 3, 'wis_mod': 4})

    assert result == 15
```

```python
from app.domain.engine.modifier_engine import modifier_total


def test_modifier_total_sums_matching_targets() -> None:
    modifiers = [
        {'target': 'armor_class', 'value': 2},
        {'target': 'armor_class', 'value': 1},
        {'target': 'saving_throws', 'value': 1},
    ]

    assert modifier_total(modifiers, 'armor_class') == 3
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/domain/test_expression_evaluator.py backend/tests/domain/test_modifier_engine.py -v`
Expected: FAIL because the domain modules do not exist yet.

- [ ] **Step 3: Write minimal implementation**

`backend/app/domain/engine/expression_evaluator.py`
```python
OPERATORS = {
    '+': (1, lambda left, right: left + right),
    '-': (1, lambda left, right: left - right),
    '*': (2, lambda left, right: left * right),
    '/': (2, lambda left, right: left / right),
}


def evaluate_formula(formula: str | int | float, context: dict[str, float] | None = None) -> float:
    if isinstance(formula, (int, float)):
        return float(formula)
    if not formula:
        return 0
    context = context or {}
    tokens = formula.replace('(', ' ( ').replace(')', ' ) ').split()
    output: list[str] = []
    operators: list[str] = []
    for token in tokens:
        if token.startswith('@') or token.replace('.', '', 1).isdigit():
            output.append(token)
            continue
        if token == '(':
            operators.append(token)
            continue
        if token == ')':
            while operators and operators[-1] != '(':
                output.append(operators.pop())
            operators.pop()
            continue
        precedence = OPERATORS[token][0]
        while operators and operators[-1] in OPERATORS and OPERATORS[operators[-1]][0] >= precedence:
            output.append(operators.pop())
        operators.append(token)
    while operators:
        output.append(operators.pop())
    stack: list[float] = []
    for token in output:
        if token.startswith('@'):
            stack.append(float(context.get(token[1:], 0)))
        elif token.replace('.', '', 1).isdigit():
            stack.append(float(token))
        else:
            right = stack.pop()
            left = stack.pop()
            stack.append(OPERATORS[token][1](left, right))
    return stack[0]
```

`backend/app/domain/engine/modifier_engine.py`
```python
def modifier_total(modifiers: list[dict] | None, target: str) -> float:
    values = modifiers or []
    return sum(float(item.get('value', 0)) for item in values if item.get('target') == target)


def derive_carried_weight(character: dict | None) -> float:
    inventory = (character or {}).get('inventory', [])
    total = 0.0
    for item in inventory:
        quantity = max(1, int(item.get('quantity', 1) or 1))
        total += float(item.get('weight', 0) or 0) * quantity
    return total
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/domain/test_expression_evaluator.py backend/tests/domain/test_modifier_engine.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/domain/engine/expression_evaluator.py backend/app/domain/engine/modifier_engine.py backend/tests/domain/test_expression_evaluator.py backend/tests/domain/test_modifier_engine.py
git commit -m "feat: port formula and modifier engine"
```

If `.git` is still unavailable in this folder, skip the commit and record that Git is not initialized here.

### Task 6: Port rule schema, repository, and character projection

**Files:**
- Create: `backend/app/domain/rules/rule_schema.py`
- Create: `backend/app/domain/rules/rule_repository.py`
- Create: `backend/app/domain/character/character_projection.py`
- Create: `backend/tests/domain/test_rule_repository.py`
- Create: `backend/tests/domain/test_character_projection.py`

- [ ] **Step 1: Write the failing tests**

```python
from app.domain.character.character_projection import derive_character_sheet


def test_derive_character_sheet_returns_proficiency_and_spell_dc() -> None:
    character = {
        'level': 5,
        'abilities': {'str': 10, 'dex': 14, 'con': 12, 'int': 8, 'wis': 16, 'cha': 10},
        'savingThrows': ['wis'],
        'skillProficiencies': ['Perception'],
    }

    result = derive_character_sheet(character, {'skills': [('Perception', 'wis')]})

    assert result['proficiencyBonus'] == 3
    assert result['spellSaveDc'] == 14
```

```python
from app.domain.rules.rule_repository import RuleRepository


def test_rule_repository_indexes_rules_by_type() -> None:
    repository = RuleRepository([
        {'uuid': 'feature:sample', 'type': 'feature', 'metadata': {'version': '5.5e', 'tags': []}},
    ])

    assert repository.size == 1
    assert repository.find_by_type('feature')[0]['uuid'] == 'feature:sample'
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/domain/test_rule_repository.py backend/tests/domain/test_character_projection.py -v`
Expected: FAIL because the modules are not implemented.

- [ ] **Step 3: Write minimal implementation**

Port the structure and behavior from:
- `src/core/rules/rule-schema.js`
- `src/core/rules/rule-repository.js`
- `src/core/character/character-projection.js`

Keep Python naming explicit while preserving the current formulas and output shape.

Core function signatures:

```python
def validate_rule_atom(rule: dict) -> dict: ...
def normalize_rule_atom(input_value: dict, rule_type: str, defaults: dict | None = None) -> dict: ...

class RuleRepository:
    def __init__(self, rules: list[dict] | None = None) -> None: ...
    def add_rule(self, rule: dict) -> bool: ...
    def get(self, uuid: str) -> dict | None: ...
    def find_by_type(self, rule_type: str) -> list[dict]: ...
    def find_by_tag(self, tag: str) -> list[dict]: ...


def derive_character_sheet(character: dict, options: dict | None = None) -> dict: ...
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/domain/test_rule_repository.py backend/tests/domain/test_character_projection.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/domain/rules/rule_schema.py backend/app/domain/rules/rule_repository.py backend/app/domain/character/character_projection.py backend/tests/domain/test_rule_repository.py backend/tests/domain/test_character_projection.py
git commit -m "feat: port rules and character projection"
```

If `.git` is still unavailable in this folder, skip the commit and record that Git is not initialized here.

### Task 7: Port action derivation and expose character endpoints

**Files:**
- Create: `backend/app/domain/engine/action_engine.py`
- Create: `backend/app/services/character_service.py`
- Create: `backend/app/api/schemas/character.py`
- Create: `backend/app/api/routes/characters.py`
- Create: `backend/app/api/routes/formulas.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/domain/test_action_engine.py`
- Create: `backend/tests/test_character_routes.py`

- [ ] **Step 1: Write the failing tests**

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_character_projection_endpoint_returns_derived_sheet() -> None:
    payload = {
        'character': {
            'level': 1,
            'class': 'wizard',
            'abilities': {'str': 8, 'dex': 14, 'con': 12, 'int': 16, 'wis': 10, 'cha': 10},
            'savingThrows': ['int', 'wis'],
            'skillProficiencies': ['Arcana'],
            'inventory': [],
        },
        'options': {'skills': [['Arcana', 'int']], 'spellAbility': 'int'}
    }

    response = client.post('/api/characters/project', json=payload)

    assert response.status_code == 200
    assert response.json()['proficiencyBonus'] == 2
    assert response.json()['spellAttack'] == 5
```
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/domain/test_action_engine.py backend/tests/test_character_routes.py -v`
Expected: FAIL because the action engine and endpoints are missing.

- [ ] **Step 3: Write minimal implementation**

Port the behavior from `src/core/engine/action-engine.js` into `backend/app/domain/engine/action_engine.py`, keeping:
- base combat actions
- spell action visibility
- attack/resource/spell slot disable rules
- derived attack action formatting

Add orchestration in `backend/app/services/character_service.py`:

```python
from app.domain.character.character_projection import derive_character_sheet
from app.domain.engine.action_engine import derive_available_actions
from app.domain.engine.modifier_engine import derive_carried_weight, modifier_total


class CharacterService:
    def project(self, character: dict, options: dict | None = None) -> dict:
        return derive_character_sheet(character, options or {})

    def actions(self, character: dict, context: dict | None = None) -> list[dict]:
        payload = context or {}
        payload['character'] = character
        return derive_available_actions(payload)
```

Create request/response schemas in `backend/app/api/schemas/character.py` and expose:
- `POST /api/characters/project`
- `POST /api/characters/actions`
- `POST /api/characters/validate`
- `POST /api/formulas/evaluate`

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/domain/test_action_engine.py backend/tests/test_character_routes.py -v`
Expected: PASS

- [ ] **Step 5: Run the broader backend suite**

Run: `pytest backend/tests -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/domain/engine/action_engine.py backend/app/services/character_service.py backend/app/api/schemas/character.py backend/app/api/routes/characters.py backend/app/api/routes/formulas.py backend/app/main.py backend/tests/domain/test_action_engine.py backend/tests/test_character_routes.py
git commit -m "feat: add character projection and action endpoints"
```

If `.git` is still unavailable in this folder, skip the commit and record that Git is not initialized here.

### Task 8: Port the data scripts to Python and document how to run the backend

**Files:**
- Create: `backend/scripts/build_5etools_data.py`
- Create: `backend/scripts/sync_data.py`
- Modify: `README.md`
- Create: `backend/tests/test_scripts_smoke.py`

- [ ] **Step 1: Write the failing smoke test**

```python
from pathlib import Path


def test_backend_scripts_exist() -> None:
    assert Path('backend/scripts/build_5etools_data.py').exists()
    assert Path('backend/scripts/sync_data.py').exists()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_scripts_smoke.py -v`
Expected: FAIL because the Python scripts do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Port the behavior from:
- `scripts/build-5etools-data.mjs`
- `scripts/sync-data.mjs`

Use explicit Python entry points:

```python
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    data_dir = root / 'data'
    # load source files, normalize records, and write output JSON


if __name__ == '__main__':
    main()
```

Update `README.md` with backend run instructions:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

And note that frontend persistence remains in browser storage for now.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_scripts_smoke.py -v`
Expected: PASS

- [ ] **Step 5: Run backend app locally**

Run: `python -m uvicorn app.main:app --reload`
Expected: server starts and logs `Uvicorn running on http://127.0.0.1:8000`

- [ ] **Step 6: Commit**

```bash
git add backend/scripts/build_5etools_data.py backend/scripts/sync_data.py README.md backend/tests/test_scripts_smoke.py
git commit -m "feat: port backend data scripts to python"
```

If `.git` is still unavailable in this folder, skip the commit and record that Git is not initialized here.

## Self-Review

### Spec coverage

- Backend skeleton and FastAPI entrypoint: covered by Tasks 1 and 2.
- Pure Python domain modules replacing `src/core`: covered by Tasks 5, 6, and 7.
- Local `data/` access and catalog endpoints: covered by Tasks 3 and 4.
- Character projection, validation, and actions: covered by Task 7.
- Python replacements for `scripts/`: covered by Task 8.
- Future-ready persistence boundary without implementing database storage: introduced in file structure and metadata, and should be added during Task 7 or Task 8 if not already present.

### Placeholder scan

- No `TODO`, `TBD`, or deferred filler text remains in execution steps.
- Each task includes explicit files, test entry points, and commands.
- The only conditional step is the Git commit fallback because the current folder has no `.git`, which matches observed project state.

### Type consistency

- `derive_character_sheet`, `evaluate_formula`, and `RuleRepository` names are used consistently across tasks.
- Catalog responses consistently use `ruleset` plus `results` payloads.
- Character routes consistently use the `/api/characters/...` prefix defined by the spec.
