from app.domain.engine.action_engine import derive_available_actions


def test_derive_available_actions_formats_attacks_spells_and_disable_flags() -> None:
    context = {
        "character": {
            "class": "wizard",
            "attacks": [
                {
                    "name": "Quarterstaff",
                    "itemId": "weapon-quarterstaff",
                    "range": {"type": "melee", "normal": 5},
                    "damage": "1d8",
                    "type": "bludgeoning",
                }
            ],
            "inventory": [
                {
                    "id": "weapon-quarterstaff",
                    "type": "weapon",
                    "properties": ["versatile"],
                    "entries": ["A simple wooden staff."],
                }
            ],
            "spells": ["Fire Bolt", "Shield"],
            "spellSlots": {"1": {"used": 1, "max": 1}},
            "resources": {"arcane-recovery": {"used": 1, "max": 1}},
        },
        "projection": {
            "proficiencyBonus": 2,
            "abilityModifiers": {"str": -1, "dex": 2, "int": 3},
            "spellAttack": 5,
            "spellSaveDc": 13,
        },
        "spellDetails": {
            "fire bolt": {
                "name": "Fire Bolt",
                "level": 0,
                "range": "120 feet",
                "castingTime": "1 action",
                "description": "Make a spell attack that deals 1d10 fire damage.",
                "components": "V, S",
            },
            "shield": {
                "name": "Shield",
                "level": 1,
                "range": "Self",
                "castingTime": "1 reaction",
                "description": "An invisible barrier of magical force appears and grants +5 AC.",
                "components": "V, S",
            },
        },
        "resourceDefinitions": [
            {
                "id": "arcane-recovery",
                "name": "Arcane Recovery",
                "kind": "class",
                "className": "Wizard",
                "actionKind": "action",
                "recovery": "long rest",
                "body": "Recover spell slots during a short rest.",
            }
        ],
    }

    result = derive_available_actions(context)

    quarterstaff = next(item for item in result if item["id"].startswith("attack:"))
    fire_bolt = next(item for item in result if item["id"] == "spell-action:fire-bolt")
    shield = next(item for item in result if item["id"] == "spell-action:shield")
    feature = next(item for item in result if item["id"] == "feature:arcane-recovery")

    assert quarterstaff["hit"] == "+1"
    assert quarterstaff["damage"] == ["1d8-1"]
    assert quarterstaff["disabled"] is False
    assert fire_bolt["kind"] == "attack"
    assert fire_bolt["hit"] == "+5"
    assert fire_bolt["disabled"] is False
    assert shield["kind"] == "reaction"
    assert shield["disabled"] is True
    assert feature["notes"] == "0/1 uses"
    assert feature["disabled"] is True
