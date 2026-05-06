"""Action derivation helpers ported from the frontend engine."""

from __future__ import annotations

import re
import unicodedata
from typing import Any

from app.domain.character.character_projection import derive_character_sheet

BASIC_ACTIONS = [
    {
        "id": "rule:attack",
        "kind": "action",
        "icon": "A",
        "name": "Attack",
        "subtitle": "Combat Action",
        "range": "--",
        "rangeLabel": "Varies",
        "hit": "--",
        "damage": [],
        "notes": "Make one attack with a weapon or an Unarmed Strike.",
        "detail": (
            "When you take the Attack action, you can make one attack roll with a "
            "weapon or an Unarmed Strike."
        ),
        "cost": {"economy": "action"},
    },
    {
        "id": "rule:dash",
        "kind": "action",
        "icon": "A",
        "name": "Dash",
        "subtitle": "Combat Action",
        "range": "Self",
        "rangeLabel": "Move",
        "hit": "--",
        "damage": [],
        "notes": "Gain extra movement for the current turn.",
        "detail": (
            "When you take the Dash action, you gain extra movement for the current "
            "turn. The increase equals your Speed after applying any modifiers."
        ),
        "cost": {"economy": "action"},
    },
    {
        "id": "rule:dodge",
        "kind": "action",
        "icon": "A",
        "name": "Dodge",
        "subtitle": "Combat Action",
        "range": "Self",
        "rangeLabel": "Defense",
        "hit": "--",
        "damage": [],
        "notes": "Attacks against you have Disadvantage.",
        "detail": (
            "Until the start of your next turn, any attack roll made against you has "
            "Disadvantage if you can see the attacker, and you make Dexterity saving "
            "throws with Advantage."
        ),
        "cost": {"economy": "action"},
    },
    {
        "id": "rule:two-weapon",
        "kind": "bonus",
        "icon": "BA",
        "name": "Two-Weapon Fighting",
        "subtitle": "Bonus Action",
        "range": "Melee",
        "rangeLabel": "Weapon",
        "hit": "--",
        "damage": [],
        "notes": "Extra attack with eligible Light weapons.",
        "detail": (
            "When you make the extra attack of the Light property, you don't add "
            "your ability modifier to the extra attack's damage unless that modifier "
            "is negative."
        ),
        "cost": {"economy": "bonus"},
    },
    {
        "id": "rule:opportunity",
        "kind": "reaction",
        "icon": "R",
        "name": "Opportunity Attack",
        "subtitle": "Reaction",
        "range": "Reach",
        "rangeLabel": "Melee",
        "hit": "--",
        "damage": [],
        "notes": "A creature leaves your reach.",
        "detail": (
            "You can make an Opportunity Attack when a creature that you can see "
            "leaves your reach using its action, Bonus Action, Reaction, or movement."
        ),
        "cost": {"economy": "reaction"},
    },
    {
        "id": "rule:interact",
        "kind": "other",
        "icon": "O",
        "name": "Interact with an Object",
        "subtitle": "Other",
        "range": "Touch",
        "rangeLabel": "Object",
        "hit": "--",
        "damage": [],
        "notes": "Interact with one object or feature.",
        "detail": (
            "You normally interact with one object or feature of the environment for "
            "free, during either your move or your action."
        ),
        "cost": {"economy": "free"},
    },
]


def derive_available_actions(context: dict | None) -> list[dict]:
    payload = dict(context or {})
    character = payload.get("character") or {}
    if "projection" not in payload:
        payload["projection"] = derive_character_sheet(
            character,
            payload.get("options") or {},
        )

    actions = [
        *derive_attack_actions(payload),
        *derive_spell_actions(payload),
        *BASIC_ACTIONS,
        *derive_feature_actions(payload),
    ]

    return [
        {
            **action,
            "disabled": is_action_disabled(action, payload),
        }
        for action in actions
    ]


def is_action_disabled(action: dict, context: dict | None) -> bool:
    payload = context or {}
    character = payload.get("character") or {}

    if action.get("resource") and not has_resource_available(
        character, str(action["resource"])
    ):
        return True
    if action.get("slotLevel") and not has_spell_slot_available(
        character, action["slotLevel"]
    ):
        return True
    return False


def derive_attack_actions(context: dict) -> list[dict]:
    character = context.get("character") or {}
    projection = context.get("projection") or {}
    ability_modifiers = projection.get("abilityModifiers") or {}

    attack_ability = "dex" if character.get("class") in {"monk", "rogue"} else "str"
    ability_mod = _to_int(ability_modifiers.get(attack_ability), 0)
    hit_bonus = _to_int(projection.get("proficiencyBonus"), 0) + ability_mod

    actions: list[dict] = []
    for index, attack in enumerate(character.get("attacks") or []):
        item = next(
            (
                entry
                for entry in (character.get("inventory") or [])
                if entry.get("id") == attack.get("itemId")
            ),
            None,
        )
        actions.append(
            {
                "id": f"attack:{index}:{_slugify(attack.get('name'))}",
                "kind": "attack",
                "icon": "ATK",
                "name": attack.get("name") or "Attack",
                "subtitle": item_type_label(item) if item else "Weapon / Attack",
                "range": compact_range(attack.get("range")),
                "rangeLabel": range_label(attack.get("range")),
                "hit": signed(hit_bonus),
                "damage": [f"{attack.get('damage') or '--'}{signed(ability_mod)}"],
                "notes": ", ".join(item_tags(item)) if item else (attack.get("type") or ""),
                "detail": entries_to_text(item.get("entries")) if item else "",
                "source": {"type": "attack", "itemId": attack.get("itemId")},
                "cost": {"economy": "action"},
            }
        )
    return actions


def derive_spell_actions(context: dict) -> list[dict]:
    character = context.get("character") or {}
    spell_details = context.get("spellDetails") or {}
    loaded_spell_details = context.get("loadedSpellDetails") or {}

    actions: list[dict] = []
    for name in character.get("spells") or []:
        spell = spell_details.get(str(name).lower()) or loaded_spell_details.get(name)
        if not spell or not spell_action_visible(spell, context):
            continue

        kind = action_kind_for_spell(spell, context)
        slot_level = _to_int(spell.get("level"), 0) or None
        actions.append(
            {
                "id": f"spell-action:{_slugify(spell.get('name'))}",
                "kind": kind,
                "icon": "SPL",
                "name": spell.get("name") or "Spell",
                "subtitle": (
                    "Cantrip"
                    if _to_int(spell.get("level"), 0) == 0
                    else f"Magia nivel {_to_int(spell.get('level'), 0)}"
                ),
                "range": compact_range(spell.get("range")),
                "rangeLabel": "Self" if spell.get("range") == "Self" else "Range",
                "hit": spell_hit_or_dc(spell, context),
                "damage": spell_damage_chips(spell.get("description")),
                "notes": (
                    spell.get("components")
                    or spell.get("levelLine")
                    or "Magic"
                ),
                "detail": str(spell.get("description") or ""),
                "slotLevel": slot_level,
                "source": {"type": "spell", "spellName": spell.get("name")},
                "cost": (
                    {
                        "resource": "spell_slot",
                        "slotLevel": slot_level,
                        "economy": kind,
                    }
                    if slot_level
                    else {"economy": kind}
                ),
            }
        )
    return actions


def derive_feature_actions(context: dict) -> list[dict]:
    character = context.get("character") or {}
    items: list[dict] = []

    for resource_def in context.get("resourceDefinitions") or []:
        resource = (character.get("resources") or {}).get(resource_def.get("id")) or {}
        maximum = _to_int(resource.get("max"), 0)
        remaining = max(0, maximum - _to_int(resource.get("used"), 0))
        subtitle = (
            resource_def.get("sourceLabel")
            if resource_def.get("kind") == "species"
            else f"{resource_def.get('className') or 'Class'} Feature"
        )

        if resource_def.get("actionKind"):
            items.append(
                {
                    "id": f"feature:{resource_def.get('id')}",
                    "kind": resource_def.get("actionKind"),
                    "icon": action_icon_for_kind(resource_def.get("actionKind")),
                    "name": resource_def.get("name") or "Feature",
                    "subtitle": subtitle,
                    "range": "Self",
                    "rangeLabel": "Resource",
                    "hit": "--",
                    "damage": [],
                    "notes": f"{remaining}/{maximum} uses",
                    "detail": str(resource_def.get("body") or ""),
                    "resource": resource_def.get("id"),
                    "source": {"type": "feature", "resourceId": resource_def.get("id")},
                    "cost": {
                        "resource": resource_def.get("id"),
                        "economy": resource_def.get("actionKind"),
                    },
                }
            )

        items.append(
            {
                "id": f"limited:{resource_def.get('id')}",
                "kind": "limited",
                "icon": "LU",
                "name": f"{resource_def.get('name') or 'Feature'} Uses",
                "subtitle": resource_recovery_label(resource_def.get("recovery")),
                "range": "Self",
                "rangeLabel": "Resource",
                "hit": "--",
                "damage": [],
                "notes": f"{remaining}/{maximum} disponivel",
                "detail": str(resource_def.get("body") or ""),
                "resource": resource_def.get("id"),
                "source": {"type": "resource", "resourceId": resource_def.get("id")},
                "cost": {"resource": resource_def.get("id")},
            }
        )
    return items


def spell_action_visible(spell: dict, context: dict) -> bool:
    kind = action_kind_for_spell(spell, context)
    if kind in {"bonus", "reaction"}:
        return True

    damage = spell_damage_chips(spell.get("description"))
    hit = spell_hit_or_dc(spell, context)
    if kind == "attack":
        return bool(damage or hit != "--")
    return _to_int(spell.get("level"), 0) > 0 or (
        _to_int(spell.get("level"), 0) == 0 and kind == "action"
    )


def action_kind_for_spell(spell: dict, context: dict) -> str:
    casting_time = str(spell.get("castingTime") or "").lower()
    if "bonus" in casting_time:
        return "bonus"
    if "reaction" in casting_time:
        return "reaction"
    if spell_damage_chips(spell.get("description")) or (
        spell_hit_or_dc(spell, context) != "--"
    ):
        return "attack"
    if re.search(
        r"ritual",
        f"{spell.get('name') or ''} {spell.get('description') or ''}",
        re.IGNORECASE,
    ):
        return "other"
    return action_kind_from_casting_time(spell.get("castingTime"))


def action_kind_from_casting_time(casting_time: Any = "") -> str:
    text = str(casting_time or "").lower()
    if "bonus" in text:
        return "bonus"
    if "reaction" in text:
        return "reaction"
    if "action" in text:
        return "action"
    return "other"


def spell_hit_or_dc(spell: dict, context: dict) -> str:
    description = str(spell.get("description") or "").lower()
    projection = (context or {}).get("projection") or {}
    if "saving throw" in description:
        return str(projection.get("spellSaveDc") or "--")
    if "spell attack" in description:
        return signed(_to_int(projection.get("spellAttack"), 0))
    return "--"


def spell_damage_chips(description: Any = "") -> list[str]:
    matches = [
        match.group(0).replace(" ", "")
        for match in re.finditer(
            r"\b\d+d\d+(?:\s*[+-]\s*\d+)?\b",
            str(description or ""),
            re.IGNORECASE,
        )
    ]
    return list(dict.fromkeys(matches))[:2]


def has_resource_available(character: dict | None, resource_id: str) -> bool:
    resource = ((character or {}).get("resources") or {}).get(resource_id)
    if not isinstance(resource, dict):
        return False
    return _to_int(resource.get("used"), 0) < _to_int(resource.get("max"), 0)


def has_spell_slot_available(character: dict | None, level: Any) -> bool:
    slots = (character or {}).get("spellSlots") or {}
    key = str(level)
    slot = slots.get(level)
    if slot is None:
        slot = slots.get(key)
    if not isinstance(slot, dict):
        return False
    return _to_int(slot.get("used"), 0) < _to_int(slot.get("max"), 0)


def action_icon_for_kind(kind: Any) -> str:
    return {
        "action": "A",
        "bonus": "BA",
        "reaction": "R",
        "other": "O",
        "limited": "LU",
        "attack": "ATK",
    }.get(kind, "LU")


def signed(value: Any) -> str:
    number = _to_int(value, 0)
    return f"+{number}" if number >= 0 else str(number)


def compact_range(value: Any) -> str:
    if isinstance(value, dict):
        normal = value.get("normal")
        long_range = value.get("long")
        unit = value.get("unit") or "ft"
        if normal is not None and long_range is not None:
            return f"{normal}/{long_range} {unit}."
        if normal is not None:
            return f"{normal} {unit}."
        if value.get("type"):
            return str(value["type"]).title()
    if value is None:
        return "--"
    text = str(value).strip()
    return text or "--"


def range_label(value: Any) -> str:
    if isinstance(value, dict):
        range_type = str(value.get("type") or "").lower()
        if range_type == "melee":
            return "Melee"
        if range_type:
            return "Range"
    text = str(value or "").strip().lower()
    if text == "self":
        return "Self"
    if text == "touch":
        return "Touch"
    return "Range"


def item_type_label(item: dict | None) -> str:
    if not item:
        return "Weapon / Attack"
    for key in ("itemType", "type", "weaponCategory", "equipmentCategory"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.replace("-", " ").title()
    return "Weapon / Attack"


def item_tags(item: dict | None) -> list[str]:
    if not item:
        return []

    tags: list[str] = []
    for key in ("type", "weaponCategory"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            tags.append(value)

    for entry in item.get("properties") or []:
        if isinstance(entry, str):
            tags.append(entry)
        elif isinstance(entry, dict) and entry.get("name"):
            tags.append(str(entry["name"]))

    return list(dict.fromkeys(tags))


def entries_to_text(entries: Any) -> str:
    if isinstance(entries, str):
        return entries
    if isinstance(entries, list):
        return "\n".join(
            part for part in (entries_to_text(item) for item in entries) if part
        )
    if isinstance(entries, dict):
        if isinstance(entries.get("entries"), list):
            return entries_to_text(entries["entries"])
        if entries.get("text"):
            return str(entries["text"])
    return ""


def resource_recovery_label(recovery: Any) -> str:
    if isinstance(recovery, list):
        return ", ".join(resource_recovery_label(item) for item in recovery if item)
    if isinstance(recovery, dict):
        for key in ("label", "type", "period"):
            value = recovery.get(key)
            if value:
                return resource_recovery_label(value)
        return "Resource"
    text = str(recovery or "").strip()
    return text.title() if text else "Resource"


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


def _to_int(value: Any, default: int) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default
