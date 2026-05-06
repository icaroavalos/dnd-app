from app.domain.engine.modifier_engine import derive_carried_weight, modifier_total


def test_modifier_total_sums_matching_targets() -> None:
    modifiers = [
        {"target": "armor_class", "value": 2},
        {"target": "armor_class", "value": 1},
        {"target": "saving_throws", "value": 1},
    ]

    assert modifier_total(modifiers, "armor_class") == 3


def test_modifier_total_treats_malformed_values_as_zero() -> None:
    modifiers = [
        {"target": "armor_class", "value": None},
        {"target": "armor_class", "value": ""},
        {"target": "armor_class", "value": "2"},
    ]

    assert modifier_total(modifiers, "armor_class") == 2


def test_derive_carried_weight_multiplies_item_weight_by_quantity() -> None:
    character = {
        "inventory": [
            {"weight": 2, "quantity": 3},
            {"weight": 1.5, "quantity": 2},
        ]
    }

    assert derive_carried_weight(character) == 9


def test_derive_carried_weight_accepts_numeric_string_and_fractional_quantity() -> None:
    character = {
        "inventory": [
            {"weight": 2, "quantity": "2.0"},
            {"weight": 4, "quantity": 2.5},
        ]
    }

    assert derive_carried_weight(character) == 14


def test_derive_carried_weight_defaults_quantity_to_one() -> None:
    character = {"inventory": [{"weight": 4, "quantity": 0}]}

    assert derive_carried_weight(character) == 4


def test_derive_carried_weight_treats_malformed_weights_as_zero() -> None:
    character = {
        "inventory": [
            {"weight": "", "quantity": 2},
            {"weight": None, "quantity": 2},
            {"weight": "abc", "quantity": 2},
            {"weight": "3", "quantity": 2},
        ]
    }

    assert derive_carried_weight(character) == 6


def test_derive_carried_weight_defaults_malformed_quantities_to_one() -> None:
    character = {
        "inventory": [
            {"weight": 2, "quantity": "abc"},
            {"weight": 3, "quantity": None},
            {"weight": 4, "quantity": ""},
        ]
    }

    assert derive_carried_weight(character) == 9
