"""Rule schema helpers ported from the frontend rules engine."""

from __future__ import annotations

import unicodedata
from typing import Any

RULE_TYPES = {"feature", "spell", "condition", "item", "action"}
ACTIVATION_TYPES = {
    "passive",
    "action",
    "bonus",
    "reaction",
    "on_hit",
    "on_equip",
    "on_attune",
    "manual",
}


def validate_rule_atom(rule: dict) -> dict:
    errors: list[str] = []

    if not isinstance(rule, dict):
        return {"valid": False, "errors": ["Rule must be an object."]}

    if not isinstance(rule.get("uuid"), str) or not rule["uuid"]:
        errors.append("uuid must be a non-empty string.")
    if not isinstance(rule.get("type"), str) or rule["type"] not in RULE_TYPES:
        errors.append(f"type must be one of: {', '.join(sorted(RULE_TYPES))}.")

    metadata = rule.get("metadata")
    if not isinstance(metadata, dict):
        errors.append("metadata must be an object.")
    else:
        if not isinstance(metadata.get("version"), str):
            errors.append("metadata.version must be a string.")
        if "tags" in metadata and not isinstance(metadata.get("tags"), list):
            errors.append("metadata.tags must be an array when present.")

    activation = rule.get("activation")
    if activation is not None:
        if not isinstance(activation, dict):
            errors.append("activation must be an object.")
        elif activation.get("type") not in ACTIVATION_TYPES:
            errors.append(
                "activation.type must be one of: "
                f"{', '.join(sorted(ACTIVATION_TYPES))}."
            )

    if rule.get("constraints") is not None and not isinstance(
        rule.get("constraints"), dict
    ):
        errors.append("constraints must be an object when present.")
    if rule.get("effects") is not None and not isinstance(rule.get("effects"), list):
        errors.append("effects must be an array when present.")
    if rule.get("depends_on") is not None and not isinstance(
        rule.get("depends_on"), list
    ):
        errors.append("depends_on must be an array when present.")

    return {"valid": not errors, "errors": errors}


def normalize_rule_atom(
    input_value: dict, rule_type: str, defaults: dict | None = None
) -> dict:
    defaults = defaults or {}
    source = str(input_value.get("source") or defaults.get("source") or "local")
    name = str(input_value.get("name") or defaults.get("name") or "Unnamed Rule")
    uuid = defaults.get("uuid") or f"{rule_type}:{_slugify(name)}:{source.lower()}"

    return {
        "uuid": uuid,
        "type": rule_type,
        "name": name,
        "source": source,
        "metadata": {
            "version": defaults.get("version", "5.5e"),
            "tags": list(defaults.get("tags", [])),
            "source": source,
        },
        "activation": defaults.get(
            "activation", {"type": "passive", "resource_cost": None}
        ),
        "constraints": defaults.get("constraints", {}),
        "effects": defaults.get("effects", []),
        "depends_on": defaults.get("depends_on", []),
        "raw": input_value,
    }


def _slugify(value: Any) -> str:
    normalized = unicodedata.normalize("NFD", str(value or ""))
    ascii_only = "".join(char for char in normalized if not unicodedata.combining(char))

    chunks: list[str] = []
    previous_dash = False
    for char in ascii_only.lower():
        if char.isalnum():
            chunks.append(char)
            previous_dash = False
            continue
        if not previous_dash:
            chunks.append("-")
            previous_dash = True

    return "".join(chunks).strip("-")
