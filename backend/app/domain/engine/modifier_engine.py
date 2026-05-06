"""Minimal modifier helpers ported from the frontend engine."""

import math


def modifier_total(modifiers: list[dict] | None, target: str) -> float:
    values = modifiers or []
    return sum(
        _numeric_value(item.get("value", 0))
        for item in values
        if item.get("target") == target
    )


def derive_carried_weight(character: dict | None) -> float:
    inventory = (character or {}).get("inventory", [])
    total = 0.0

    for item in inventory:
        quantity = max(1, _numeric_value(item.get("quantity", 1)) or 1)
        total += _numeric_value(item.get("weight", 0)) * quantity

    return total


def _numeric_value(value: object) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    return number if math.isfinite(number) else 0.0
