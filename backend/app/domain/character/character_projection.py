"""Character projection helpers ported from the frontend engine."""

from __future__ import annotations

import math
import unicodedata
from typing import Any

from app.domain.engine.expression_evaluator import evaluate_formula
from app.domain.engine.modifier_engine import derive_carried_weight, modifier_total

DEFAULT_ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"]


def derive_character_sheet(character: dict, options: dict | None = None) -> dict:
    options = options or {}
    ability_keys = options.get("abilityKeys") or DEFAULT_ABILITY_KEYS
    skills = options.get("skills") or []
    level = max(1, _to_int(character.get("level"), 1))
    proficiency_bonus = proficiency_for_level(level)
    active_modifiers = options.get("modifiers") or []

    ability_scores = {
        key: _clamp(
            _to_int((character.get("abilities") or {}).get(key), 10)
            + _ability_bonus_from_asi(character, key),
            1,
            30,
        )
        for key in ability_keys
    }
    ability_modifiers = {
        key: ability_modifier(ability_scores[key]) for key in ability_keys
    }
    saving_throw_proficiencies = character.get("savingThrows") or []
    skill_proficiencies = character.get("skillProficiencies") or []

    saving_throws = {
        key: (
            ability_modifiers[key]
            + (proficiency_bonus if key in saving_throw_proficiencies else 0)
            + modifier_total(active_modifiers, "saving_throws")
            + modifier_total(active_modifiers, f"save:{key}")
        )
        for key in ability_keys
    }
    skill_bonuses = {
        name: (
            ability_modifiers.get(ability, 0)
            + (proficiency_bonus if name in skill_proficiencies else 0)
            + _skill_choice_bonus(character, name, ability_modifiers)
            + modifier_total(active_modifiers, "ability_checks")
            + modifier_total(active_modifiers, f"ability_check:{ability}")
            + modifier_total(active_modifiers, f"skill:{_slugify(name)}")
        )
        for name, ability in skills
    }

    class_rule = _find_class_rule(character, options)
    raw_class = (class_rule or {}).get("raw") or {}
    hit_die = _to_int(
        raw_class.get("hit_die")
        if "hit_die" in raw_class
        else raw_class.get("hitDie", options.get("defaultHitDie", 8)),
        8,
    )
    max_hp = _max_hit_points(level, hit_die, ability_modifiers.get("con", 0))
    formula_context = _create_formula_context(proficiency_bonus, ability_modifiers)
    spell_ability = options.get("spellAbility") or "wis"
    carried_weight = derive_carried_weight(character)
    carrying_capacity = max(0, ability_scores.get("str", 10) * 15)

    base_armor_class = (
        options["baseArmorClass"]
        if "baseArmorClass" in options and options["baseArmorClass"] is not None
        else 10 + ability_modifiers.get("dex", 0)
    )

    return {
        "level": level,
        "proficiencyBonus": proficiency_bonus,
        "abilityScores": ability_scores,
        "abilityModifiers": ability_modifiers,
        "savingThrows": saving_throws,
        "skillBonuses": skill_bonuses,
        "activeModifiers": active_modifiers,
        "encumbrance": {
            "carriedWeight": carried_weight,
            "carryingCapacity": carrying_capacity,
            "encumbered": carrying_capacity > 0 and carried_weight > carrying_capacity,
        },
        "armorClass": base_armor_class + modifier_total(active_modifiers, "armor_class"),
        "hitDie": hit_die,
        "maxHp": max_hp,
        "spellAttack": proficiency_bonus + ability_modifiers.get(spell_ability, 0),
        "spellSaveDc": evaluate_formula(
            f"8 + @prof + @{spell_ability}_mod", formula_context
        ),
        "formulaContext": formula_context,
    }


def proficiency_for_level(level: int | float) -> int:
    return math.ceil((_to_float(level, 1) or 1) / 4) + 1


def ability_modifier(score: int | float) -> int:
    return math.floor((_to_float(score, 10) - 10) / 2)


def _ability_bonus_from_asi(character: dict, key: str) -> int:
    total = 0
    for choice in (character.get("asiChoices") or {}).values():
        if choice.get("mode") == "feat":
            continue
        pattern = "plus1plus1" if choice.get("pattern") == "plus1plus1" else "plus2"
        if pattern == "plus2" and choice.get("ability1") == key:
            total += 2
        elif pattern == "plus1plus1" and (
            choice.get("ability1") == key or choice.get("ability2") == key
        ):
            total += 1
    return total


def _skill_choice_bonus(
    character: dict, name: str, ability_modifiers: dict[str, int]
) -> int:
    choices = character.get("classFeatureChoices") or {}
    if character.get("class") == "druid" and choices.get("primal-order") == "magician":
        target = choices.get("magician-skill")
        if target and _slugify(name) == target:
            return max(1, ability_modifiers.get("wis", 0))
    return 0


def _max_hit_points(level: int, hit_die: int, con_mod: int) -> int:
    first = max(1, hit_die + con_mod)
    later = max(1, math.floor(hit_die / 2) + 1 + con_mod)
    return first + max(0, level - 1) * later


def _find_class_rule(character: dict, options: dict) -> dict | None:
    rules = options.get("rules")
    find_by_type = getattr(rules, "find_by_type", None)
    if not callable(find_by_type):
        return None

    target_uuid = f"class:{character.get('class')}"
    for rule in find_by_type("feature"):
        if rule.get("uuid") == target_uuid:
            return rule
    return None


def _create_formula_context(
    proficiency_bonus: int, ability_modifiers: dict[str, int]
) -> dict[str, int]:
    return {
        "prof": proficiency_bonus,
        "proficiency": proficiency_bonus,
        "str_mod": ability_modifiers.get("str", 0),
        "dex_mod": ability_modifiers.get("dex", 0),
        "con_mod": ability_modifiers.get("con", 0),
        "int_mod": ability_modifiers.get("int", 0),
        "wis_mod": ability_modifiers.get("wis", 0),
        "cha_mod": ability_modifiers.get("cha", 0),
    }


def _clamp(value: int, minimum: int, maximum: int) -> int:
    return min(maximum, max(minimum, value))


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


def _to_float(value: Any, default: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return number if math.isfinite(number) else default


def _to_int(value: Any, default: int) -> int:
    return int(_to_float(value, default))
