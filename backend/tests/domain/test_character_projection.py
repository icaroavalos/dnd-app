from app.domain.character.character_projection import derive_character_sheet


def test_derive_character_sheet_returns_proficiency_and_spell_dc() -> None:
    character = {
        "level": 5,
        "abilities": {
            "str": 10,
            "dex": 14,
            "con": 12,
            "int": 8,
            "wis": 16,
            "cha": 10,
        },
        "savingThrows": ["wis"],
        "skillProficiencies": ["Perception"],
    }

    result = derive_character_sheet(character, {"skills": [("Perception", "wis")]})

    assert result["proficiencyBonus"] == 3
    assert result["spellSaveDc"] == 14


def test_derive_character_sheet_applies_modifiers_and_encumbrance() -> None:
    character = {
        "level": 1,
        "abilities": {"str": 15, "dex": 12, "con": 14, "int": 10, "wis": 13, "cha": 8},
        "inventory": [{"weight": 20, "quantity": 12}],
    }

    result = derive_character_sheet(
        character,
        {
            "skills": [("Athletics", "str")],
            "modifiers": [
                {"target": "armor_class", "value": 1},
                {"target": "ability_checks", "value": 1},
                {"target": "skill:athletics", "value": 2},
            ],
        },
    )

    assert result["armorClass"] == 12
    assert result["skillBonuses"]["Athletics"] == 5
    assert result["encumbrance"]["encumbered"] is True
