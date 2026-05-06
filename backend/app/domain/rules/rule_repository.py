"""Rule repository helpers ported from the frontend rules engine."""

from __future__ import annotations

import unicodedata
from typing import Any

from app.domain.rules.rule_schema import normalize_rule_atom, validate_rule_atom


class RuleRepository:
    def __init__(self, rules: list[dict] | None = None) -> None:
        self.rules: dict[str, dict] = {}
        self.by_type: dict[str, dict[str, dict]] = {}
        self.validation_errors: list[dict[str, Any]] = []
        self.add_rules(rules or [])

    @classmethod
    def from_api(cls, api: dict | None) -> "RuleRepository":
        source = (api or {}).get("source") or {}

        rules = [
            *[
                normalize_rule_atom(
                    item,
                    "feature",
                    {
                        "uuid": f"class:{_slugify(item.get('name') or 'unknown')}",
                        "tags": ["class"],
                    },
                )
                for item in ((api or {}).get("classes") or {}).values()
            ],
            *[
                normalize_rule_atom(
                    item,
                    "feature",
                    {
                        "uuid": (
                            f"feature:{_slugify(item.get('className'))}:"
                            f"{_slugify(item.get('name'))}:{item.get('level') or 1}:"
                            f"{str(item.get('source') or 'local').lower()}"
                        ),
                        "tags": ["class-feature", _slugify(item.get("className"))],
                    },
                )
                for item in source.get("classFeatures", [])
            ],
            *[
                normalize_rule_atom(
                    item,
                    "spell",
                    {
                        "uuid": (
                            f"spell:{_slugify(item.get('name'))}:"
                            f"{str(item.get('source') or 'local').lower()}"
                        ),
                        "activation": {
                            "type": _action_activation_from_casting_time(
                                item.get("castingTime")
                            ),
                            "resource_cost": (
                                "spell_slot"
                                if (item.get("level") or 0) > 0
                                else None
                            ),
                        },
                        "tags": ["spell", f"level-{item.get('level') or 0}"],
                    },
                )
                for item in (source.get("spellDetails") or {}).values()
            ],
            *[
                normalize_rule_atom(
                    item,
                    "item",
                    {
                        "uuid": (
                            f"item:{_slugify(item.get('name'))}:"
                            f"{str(item.get('source') or 'local').lower()}"
                        ),
                        "activation": {"type": "on_equip", "resource_cost": None},
                        "tags": ["item"],
                    },
                )
                for item in (source.get("itemDetails") or {}).values()
            ],
        ]

        return cls(rules)

    @property
    def size(self) -> int:
        return len(self.rules)

    def add_rules(self, rules: list[dict] | None = None) -> None:
        for rule in rules or []:
            self.add_rule(rule)

    def add_rule(self, rule: dict) -> bool:
        validation = validate_rule_atom(rule)
        if not validation["valid"]:
            self.validation_errors.append(
                {
                    "uuid": rule.get("uuid", "(unknown)") if isinstance(rule, dict) else "(unknown)",
                    "errors": validation["errors"],
                }
            )
            return False

        uuid = rule["uuid"]
        rule_type = rule["type"]
        self.rules[uuid] = rule
        self.by_type.setdefault(rule_type, {})[uuid] = rule
        return True

    def get(self, uuid: str) -> dict | None:
        return self.rules.get(uuid)

    def find_by_type(self, rule_type: str) -> list[dict]:
        return list(self.by_type.get(rule_type, {}).values())

    def find_by_tag(self, tag: str) -> list[dict]:
        return [
            rule
            for rule in self.rules.values()
            if tag in ((rule.get("metadata") or {}).get("tags") or [])
        ]


def _action_activation_from_casting_time(casting_time: Any = "") -> str:
    text = str(casting_time or "").lower()
    if "bonus" in text:
        return "bonus"
    if "reaction" in text:
        return "reaction"
    if "action" in text:
        return "action"
    return "manual"


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
