from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


JsonDict = dict[str, Any]


def classic_class(item: JsonDict) -> bool:
    return (item.get("edition") or "classic") != "one"


def classic_content(item: JsonDict) -> bool:
    return (item.get("edition") or "classic") != "one" and item.get("source") != "XPHB"


def one_class(item: JsonDict) -> bool:
    return item.get("edition") == "one" or item.get("source") == "XPHB"


def one_content(item: JsonDict) -> bool:
    return item.get("edition") == "one" or item.get("source") == "XPHB"


RULESETS: dict[str, dict[str, Any]] = {
    "5e-2014": {
        "label": "5e / 2014 rules from local 5etools",
        "class_edition": classic_class,
        "content_edition": classic_content,
        "spell_source": lambda source: source != "XPHB",
        "class_source": lambda source: source != "XPHB",
    },
    "5e-2024": {
        "label": "5.5e / 2024 rules from local 5etools",
        "class_edition": one_class,
        "content_edition": one_content,
        "spell_source": lambda source: source == "XPHB",
        "class_source": lambda source: source == "XPHB",
    },
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build compact 5etools data for the character builder."
    )
    parser.add_argument(
        "five_tools_root",
        nargs="?",
        help="Path to the local 5etools folder. Defaults to ./5etools-v2.28.0.",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    data_dir = root / "data"
    output_dir = data_dir / "5etools"
    five_tools_root = (
        Path(args.five_tools_root).resolve()
        if args.five_tools_root
        else (root / "5etools-v2.28.0").resolve()
    )
    source_data_dir = five_tools_root / "data"

    output_dir.mkdir(parents=True, exist_ok=True)

    class_files = list_json_files(source_data_dir / "class", "class-*.json")
    spell_files = list_json_files(source_data_dir / "spells", "spells-*.json")
    spell_sources = read_json(source_data_dir / "spells" / "sources.json")
    race_data = read_json(source_data_dir / "races.json")
    background_data = read_json(source_data_dir / "backgrounds.json")
    item_data = read_json(source_data_dir / "items-base.json")
    feat_data = read_json(source_data_dir / "feats.json")

    all_class_data = [read_json(path) for path in class_files]
    all_spell_data = [read_json(path) for path in spell_files]

    all_classes = flatten(all_class_data, "class")
    all_subclasses = flatten(all_class_data, "subclass")
    all_class_features = flatten(all_class_data, "classFeature")
    all_subclass_features = flatten(all_class_data, "subclassFeature")
    all_spells = flatten(all_spell_data, "spell")

    manifest: JsonDict = {
        "generatedAt": utc_now(),
        "source": {
            "name": "5etools local data",
            "path": str(five_tools_root),
        },
        "note": (
            "Compact character-builder data extracted from the user's local "
            "5etools folder. Source filtering is preserved so the app can "
            "distinguish 2014 and 2024 rules."
        ),
        "rulesets": {},
    }

    races_by_key = {
        key_for(race.get("name"), race.get("source")): race
        for race in race_data.get("race", [])
    }

    for ruleset, config in RULESETS.items():
        ruleset_dir = output_dir / ruleset
        ruleset_dir.mkdir(parents=True, exist_ok=True)

        classes = [
            normalize_class(item)
            for item in all_classes
            if config["class_edition"](item)
        ]
        class_key_set = {
            key_for(item.get("name"), item.get("source")) for item in classes
        }

        subclasses = [
            normalize_subclass(item)
            for item in all_subclasses
            if key_for(item.get("className"), item.get("classSource")) in class_key_set
        ]

        class_features = [
            normalize_class_feature(item)
            for item in all_class_features
            if key_for(item.get("className"), item.get("classSource")) in class_key_set
        ]

        subclass_key_set = {
            key_for(
                item.get("name"),
                item.get("source"),
                item.get("className"),
                item.get("classSource"),
            )
            for item in subclasses
        }
        subclass_features = [
            normalize_subclass_feature(item)
            for item in all_subclass_features
            if key_for(
                item.get("subclassShortName") or item.get("subclassName"),
                item.get("subclassSource"),
                item.get("className"),
                item.get("classSource"),
            )
            in subclass_key_set
        ]

        races = [
            normalize_race(item)
            for item in race_data.get("race", [])
            if config["content_edition"](item)
        ]
        subraces = [
            normalize_subrace(item, races_by_key)
            for item in race_data.get("subrace", [])
            if config["content_edition"](subrace_with_edition(item, races_by_key))
        ]
        backgrounds = [
            normalize_background(item)
            for item in background_data.get("background", [])
            if config["content_edition"](item)
        ]
        equipment = [
            normalize_item(item)
            for item in item_data.get("baseitem", [])
            if config["content_edition"](item)
        ]
        feats = [
            normalize_feat(item)
            for item in feat_data.get("feat", [])
            if config["content_edition"](item)
        ]
        spells = [
            normalize_spell(item)
            for item in all_spells
            if config["spell_source"](item.get("source"))
        ]
        class_spells = build_class_spells(spells, spell_sources, config)

        write_json(ruleset_dir / "classes.json", {"ruleset": ruleset, "results": classes})
        write_json(
            ruleset_dir / "subclasses.json",
            {"ruleset": ruleset, "results": subclasses},
        )
        write_json(
            ruleset_dir / "class-features.json",
            {"ruleset": ruleset, "results": class_features},
        )
        write_json(
            ruleset_dir / "subclass-features.json",
            {"ruleset": ruleset, "results": subclass_features},
        )
        write_json(ruleset_dir / "races.json", {"ruleset": ruleset, "results": races})
        write_json(
            ruleset_dir / "subraces.json", {"ruleset": ruleset, "results": subraces}
        )
        write_json(
            ruleset_dir / "backgrounds.json",
            {"ruleset": ruleset, "results": backgrounds},
        )
        write_json(
            ruleset_dir / "equipment.json",
            {"ruleset": ruleset, "results": equipment},
        )
        write_json(ruleset_dir / "feats.json", {"ruleset": ruleset, "results": feats})
        write_json(
            ruleset_dir / "spells.json", {"ruleset": ruleset, "results": spells}
        )
        write_json(
            ruleset_dir / "class-spells.json",
            {"ruleset": ruleset, "results": class_spells},
        )

        manifest["rulesets"][ruleset] = {
            "label": config["label"],
            "counts": {
                "classes": len(classes),
                "subclasses": len(subclasses),
                "classFeatures": len(class_features),
                "subclassFeatures": len(subclass_features),
                "races": len(races),
                "subraces": len(subraces),
                "backgrounds": len(backgrounds),
                "equipment": len(equipment),
                "feats": len(feats),
                "spells": len(spells),
                "classSpellLists": len(class_spells),
            },
        }

    write_json(output_dir / "manifest.json", manifest)
    print(f"Built compact 5etools data into {output_dir}")


def flatten(files: list[JsonDict], key: str) -> list[JsonDict]:
    values: list[JsonDict] = []
    for file_data in files:
        values.extend(file_data.get(key, []))
    return values


def subrace_with_edition(item: JsonDict, races_by_key: dict[str, JsonDict]) -> JsonDict:
    edition = item.get("edition")
    if edition is None:
        parent = races_by_key.get(key_for(item.get("raceName"), item.get("raceSource")))
        edition = parent.get("edition") if parent else None
    merged = dict(item)
    if edition is not None:
        merged["edition"] = edition
    return merged


def normalize_class(item: JsonDict) -> JsonDict:
    hit_die = None
    hd = item.get("hd")
    if isinstance(hd, dict) and hd.get("faces") is not None:
        hit_die = f"d{hd['faces']}"
    return pick_defined(
        {
            "name": item.get("name"),
            "source": item.get("source"),
            "edition": item.get("edition") or "classic",
            "hitDie": hit_die,
            "proficiency": item.get("proficiency") or [],
            "spellcastingAbility": item.get("spellcastingAbility"),
            "casterProgression": item.get("casterProgression"),
            "preparedSpells": item.get("preparedSpells"),
            "preparedSpellsProgression": item.get("preparedSpellsProgression"),
            "cantripProgression": item.get("cantripProgression"),
            "startingProficiencies": item.get("startingProficiencies"),
            "startingEquipment": item.get("startingEquipment"),
            "multiclassing": item.get("multiclassing"),
            "classTableGroups": item.get("classTableGroups"),
        }
    )


def normalize_subclass(item: JsonDict) -> JsonDict:
    return pick_defined(
        {
            "name": item.get("name"),
            "shortName": item.get("shortName"),
            "source": item.get("source"),
            "className": item.get("className"),
            "classSource": item.get("classSource"),
            "subclassFeatures": item.get("subclassFeatures"),
            "additionalSpells": item.get("additionalSpells"),
        }
    )


def normalize_class_feature(item: JsonDict) -> JsonDict:
    return pick_defined(
        {
            "name": item.get("name"),
            "source": item.get("source"),
            "className": item.get("className"),
            "classSource": item.get("classSource"),
            "level": item.get("level"),
            "entries": item.get("entries"),
        }
    )


def normalize_subclass_feature(item: JsonDict) -> JsonDict:
    return pick_defined(
        {
            "name": item.get("name"),
            "source": item.get("source"),
            "className": item.get("className"),
            "classSource": item.get("classSource"),
            "subclassShortName": item.get("subclassShortName"),
            "subclassSource": item.get("subclassSource"),
            "level": item.get("level"),
            "entries": item.get("entries"),
        }
    )


def normalize_race(item: JsonDict) -> JsonDict:
    return pick_defined(
        {
            "name": item.get("name"),
            "source": item.get("source"),
            "edition": item.get("edition") or "classic",
            "size": item.get("size"),
            "speed": item.get("speed"),
            "ability": item.get("ability"),
            "skillProficiencies": item.get("skillProficiencies"),
            "languageProficiencies": item.get("languageProficiencies"),
            "entries": item.get("entries"),
            "srd": item.get("srd"),
            "srd52": item.get("srd52"),
        }
    )


def normalize_subrace(item: JsonDict, races_by_key: dict[str, JsonDict]) -> JsonDict:
    merged = subrace_with_edition(item, races_by_key)
    return pick_defined(
        {
            "name": merged.get("name"),
            "source": merged.get("source"),
            "raceName": merged.get("raceName"),
            "raceSource": merged.get("raceSource"),
            "edition": merged.get("edition") or "classic",
            "ability": merged.get("ability"),
            "skillProficiencies": merged.get("skillProficiencies"),
            "languageProficiencies": merged.get("languageProficiencies"),
            "entries": merged.get("entries"),
            "srd": merged.get("srd"),
            "srd52": merged.get("srd52"),
        }
    )


def normalize_background(item: JsonDict) -> JsonDict:
    return pick_defined(
        {
            "name": item.get("name"),
            "source": item.get("source"),
            "edition": item.get("edition") or "classic",
            "ability": item.get("ability"),
            "skillProficiencies": item.get("skillProficiencies"),
            "toolProficiencies": item.get("toolProficiencies"),
            "languageProficiencies": item.get("languageProficiencies"),
            "startingEquipment": item.get("startingEquipment"),
            "feats": item.get("feats"),
            "entries": item.get("entries"),
        }
    )


def normalize_item(item: JsonDict) -> JsonDict:
    return pick_defined(
        {
            "name": item.get("name"),
            "source": item.get("source"),
            "edition": item.get("edition") or "classic",
            "type": item.get("type"),
            "value": item.get("value"),
            "weight": item.get("weight"),
            "ac": item.get("ac"),
            "dmg1": item.get("dmg1"),
            "dmgType": item.get("dmgType"),
            "range": item.get("range"),
            "property": item.get("property"),
            "entries": item.get("entries"),
        }
    )


def normalize_feat(item: JsonDict) -> JsonDict:
    return pick_defined(
        {
            "name": item.get("name"),
            "source": item.get("source"),
            "edition": item.get("edition") or "classic",
            "category": item.get("category"),
            "prerequisite": item.get("prerequisite"),
            "repeatable": item.get("repeatable"),
            "ability": item.get("ability"),
            "entries": item.get("entries"),
            "srd": item.get("srd"),
            "srd52": item.get("srd52"),
        }
    )


def normalize_spell(item: JsonDict) -> JsonDict:
    return pick_defined(
        {
            "name": item.get("name"),
            "source": item.get("source"),
            "level": item.get("level"),
            "school": item.get("school"),
            "time": item.get("time"),
            "range": item.get("range"),
            "components": item.get("components"),
            "duration": item.get("duration"),
            "meta": item.get("meta"),
            "entries": item.get("entries"),
            "entriesHigherLevel": item.get("entriesHigherLevel"),
            "srd": item.get("srd"),
            "srd52": item.get("srd52"),
        }
    )


def build_class_spells(
    spells: list[JsonDict], source_map: JsonDict, config: dict[str, Any]
) -> list[JsonDict]:
    spell_keys = {key_for(item.get("name"), item.get("source")) for item in spells}
    lists: dict[str, JsonDict] = {}

    for spell_source, spell_entries in source_map.items():
        if not config["spell_source"](spell_source):
            continue
        for spell_name, refs in spell_entries.items():
            if key_for(spell_name, spell_source) not in spell_keys:
                continue
            for klass in refs.get("class", []):
                if not config["class_source"](klass.get("source")):
                    continue
                list_key = key_for(klass.get("name"), klass.get("source"))
                lists.setdefault(
                    list_key,
                    {
                        "className": klass.get("name"),
                        "classSource": klass.get("source"),
                        "spells": [],
                    },
                )
                lists[list_key]["spells"].append(
                    {"name": spell_name, "source": spell_source}
                )

    for list_data in lists.values():
        list_data["spells"].sort(key=lambda item: item["name"])

    return [lists[key] for key in sorted(lists)]


def list_json_files(directory: Path, pattern: str) -> list[Path]:
    return sorted(directory.glob(pattern))


def read_json(path: Path) -> JsonDict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{json.dumps(data, indent=2)}\n", encoding="utf-8")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def key_for(*parts: Any) -> str:
    return "|".join(str(part or "").lower() for part in parts)


def pick_defined(data: JsonDict) -> JsonDict:
    return {key: value for key, value in data.items() if value is not None}


if __name__ == "__main__":
    main()
