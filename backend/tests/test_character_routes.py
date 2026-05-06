from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_character_projection_endpoint_returns_derived_sheet() -> None:
    payload = {
        "character": {
            "level": 1,
            "class": "wizard",
            "abilities": {
                "str": 8,
                "dex": 14,
                "con": 12,
                "int": 16,
                "wis": 10,
                "cha": 10,
            },
            "savingThrows": ["int", "wis"],
            "skillProficiencies": ["Arcana"],
            "inventory": [],
        },
        "options": {"skills": [["Arcana", "int"]], "spellAbility": "int"},
    }

    response = client.post("/api/characters/project", json=payload)

    assert response.status_code == 200
    assert response.json()["proficiencyBonus"] == 2
    assert response.json()["spellAttack"] == 5


def test_character_actions_endpoint_returns_actions() -> None:
    payload = {
        "character": {
            "level": 1,
            "class": "wizard",
            "abilities": {
                "str": 8,
                "dex": 14,
                "con": 12,
                "int": 16,
                "wis": 10,
                "cha": 10,
            },
            "spells": ["Fire Bolt"],
            "inventory": [],
        },
        "context": {
            "options": {"spellAbility": "int"},
            "spellDetails": {
                "fire bolt": {
                    "name": "Fire Bolt",
                    "level": 0,
                    "range": "120 feet",
                    "castingTime": "1 action",
                    "description": "Make a spell attack that deals 1d10 fire damage.",
                }
            },
        },
    }

    response = client.post("/api/characters/actions", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert any(item["id"] == "spell-action:fire-bolt" for item in body["results"])


def test_character_actions_endpoint_uses_supplied_projection() -> None:
    payload = {
        "character": {
            "level": 1,
            "class": "wizard",
            "abilities": {
                "str": 8,
                "dex": 14,
                "con": 12,
                "int": 16,
                "wis": 10,
                "cha": 10,
            },
            "spells": ["Fire Bolt"],
            "inventory": [],
        },
        "context": {
            "projection": {
                "proficiencyBonus": 2,
                "abilityModifiers": {"str": -1, "dex": 2, "int": 3},
                "spellAttack": 99,
                "spellSaveDc": 17,
            },
            "spellDetails": {
                "fire bolt": {
                    "name": "Fire Bolt",
                    "level": 0,
                    "range": "120 feet",
                    "castingTime": "1 action",
                    "description": "Make a spell attack that deals 1d10 fire damage.",
                }
            },
        },
    }

    response = client.post("/api/characters/actions", json=payload)

    assert response.status_code == 200
    body = response.json()
    action = next(item for item in body["results"] if item["id"] == "spell-action:fire-bolt")
    assert action["hit"] == "+99"


def test_character_validate_endpoint_reports_valid_projection() -> None:
    payload = {
        "character": {
            "level": 1,
            "abilities": {
                "str": 10,
                "dex": 10,
                "con": 10,
                "int": 10,
                "wis": 10,
                "cha": 10,
            },
            "inventory": [],
        },
        "options": {},
    }

    response = client.post("/api/characters/validate", json=payload)

    assert response.status_code == 200
    assert response.json()["valid"] is True
    assert response.json()["errors"] == []


def test_formula_evaluate_endpoint_returns_result() -> None:
    response = client.post(
        "/api/formulas/evaluate",
        json={"formula": "8 + @prof + @int_mod", "context": {"prof": 2, "int_mod": 3}},
    )

    assert response.status_code == 200
    assert response.json() == {"result": 13.0}


def test_formula_evaluate_endpoint_accepts_malformed_context_values() -> None:
    response = client.post(
        "/api/formulas/evaluate",
        json={
            "formula": "10 + @empty + @text + @none",
            "context": {"empty": "", "text": "abc", "none": None},
        },
    )

    assert response.status_code == 200
    assert response.json() == {"result": 10.0}


def test_formula_evaluate_endpoint_returns_client_error_for_divide_by_zero() -> None:
    response = client.post(
        "/api/formulas/evaluate",
        json={"formula": "1 / 0", "context": {}},
    )

    assert response.status_code == 400
    assert response.json()["detail"]
