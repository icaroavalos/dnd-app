from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote
from urllib.request import Request, urlopen


DND_2014 = "https://www.dnd5eapi.co/api/2014"
OPEN5E = "https://api.open5e.com/v2"

SUPPLEMENTS: dict[str, dict[str, Any]] = {
    "5e-2014": {
        "subraces": {
            "source": "local-curated-supplement",
            "reason": (
                "Public SRD APIs expose a limited set of species/subrace data. "
                "This supplement keeps the character builder aligned with common "
                "5e 2014 character creation options."
            ),
            "races": {
                "dragonborn": ["Dragonborn"],
                "dwarf": ["Hill Dwarf", "Mountain Dwarf"],
                "elf": ["High Elf", "Wood Elf", "Dark Elf"],
                "gnome": ["Forest Gnome", "Rock Gnome"],
                "half-elf": ["Half Elf"],
                "half-orc": ["Half Orc"],
                "halfling": ["Lightfoot Halfling", "Stout Halfling"],
                "human": ["Human"],
                "tiefling": ["Tiefling"],
                "Turtle": ["Turtle"],
            },
        }
    }
}

DND_ENDPOINTS = [
    "ability-scores",
    "alignments",
    "backgrounds",
    "classes",
    "equipment",
    "equipment-categories",
    "feats",
    "features",
    "languages",
    "proficiencies",
    "races",
    "skills",
    "spells",
    "subclasses",
    "subraces",
    "traits",
    "weapon-properties",
]

OPEN5E_ENDPOINTS = [
    "abilities",
    "alignments",
    "armor",
    "backgrounds",
    "classes",
    "conditions",
    "damagetypes",
    "feats",
    "items",
    "itemcategories",
    "languages",
    "rules",
    "skills",
    "species",
    "spells",
    "spellschools",
    "weapons",
    "weaponproperties",
]

SOURCES: dict[str, list[dict[str, str]]] = {
    "5e-2014": [
        {
            "provider": "dnd5eapi",
            "label": "D&D 5e API SRD 2014",
            "baseUrl": DND_2014,
            "type": "dnd5eapi-2014",
        },
        {
            "provider": "open5e",
            "label": "Open5e SRD 2014",
            "documentKey": "srd-2014",
            "baseUrl": OPEN5E,
            "type": "open5e-v2",
        },
    ],
    "5e-2024": [
        {
            "provider": "open5e",
            "label": "Open5e SRD 2024 / 5.5e",
            "documentKey": "srd-2024",
            "baseUrl": OPEN5E,
            "type": "open5e-v2",
        },
        {
            "provider": "open5e",
            "label": "Open5e Originals 2024 / 5.5e",
            "documentKey": "open5e-2024",
            "baseUrl": OPEN5E,
            "type": "open5e-v2",
        },
    ],
}


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    data_dir = root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "generatedAt": utc_now(),
        "note": "Character-builder data only. Monsters are intentionally excluded.",
        "rulesets": {
            "5e-2014": {
                "label": "5e / 2014 rules",
                "sources": [
                    {
                        "label": source["label"],
                        "provider": source["provider"],
                        "documentKey": source.get("documentKey"),
                        "baseUrl": source["baseUrl"],
                    }
                    for source in SOURCES["5e-2014"]
                ],
                "supplements": ["data/supplements/5e-2014/subraces.json"],
            },
            "5e-2024": {
                "label": "5.5e / 2024 rules",
                "sources": [
                    {
                        "label": source["label"],
                        "provider": source["provider"],
                        "documentKey": source.get("documentKey"),
                        "baseUrl": source["baseUrl"],
                    }
                    for source in SOURCES["5e-2024"]
                ],
            },
        },
    }

    for ruleset, sources in SOURCES.items():
        ruleset_dir = data_dir / ruleset
        ruleset_dir.mkdir(parents=True, exist_ok=True)

        for source in sources:
            source_dir_name = (
                source["documentKey"] if source["provider"] == "open5e" else source["provider"]
            )
            source_dir = ruleset_dir / source_dir_name
            source_dir.mkdir(parents=True, exist_ok=True)

            if source["type"] == "dnd5eapi-2014":
                download_dnd5e_api(source_dir)
            else:
                download_open5e_source(source_dir, source["documentKey"])

    write_json(data_dir / "manifest.json", manifest)
    write_supplements(data_dir)
    print(f"Downloaded data into {data_dir}")


def download_dnd5e_api(directory: Path) -> None:
    index: dict[str, Any] = {}

    for endpoint in DND_ENDPOINTS:
        print(f"dnd5eapi 2014: {endpoint}")
        listing = fetch_json(f"{DND_2014}/{endpoint}")
        details = []

        for item in listing.get("results", []):
            url = item.get("url")
            if not url:
                continue
            details.append(fetch_json(f"https://www.dnd5eapi.co{url}"))

        index[endpoint] = {"count": len(details)}
        write_json(
            directory / f"{endpoint}.json",
            {"source": DND_2014, "endpoint": endpoint, "list": listing, "results": details},
        )

    download_dnd_class_companions(directory)
    write_json(directory / "index.json", index)


def download_dnd_class_companions(directory: Path) -> None:
    classes = fetch_json(f"{DND_2014}/classes")
    levels_by_class: dict[str, Any] = {}
    spells_by_class: dict[str, Any] = {}

    for klass in classes.get("results", []):
        class_index = klass["index"]
        print(f"dnd5eapi 2014: class companions {class_index}")
        levels_by_class[class_index] = fetch_json(f"{DND_2014}/classes/{class_index}/levels")
        try:
            spells_by_class[class_index] = fetch_json(
                f"{DND_2014}/classes/{class_index}/spells"
            )
        except RuntimeError:
            spells_by_class[class_index] = {"count": 0, "results": []}

    write_json(directory / "class-levels.json", levels_by_class)
    write_json(directory / "class-spells.json", spells_by_class)


def download_open5e_source(directory: Path, document_key: str) -> None:
    index: dict[str, Any] = {}

    for endpoint in OPEN5E_ENDPOINTS:
        print(f"open5e {document_key}: {endpoint}")
        first_url = (
            f"{OPEN5E}/{endpoint}/?document__key={quote(document_key)}&limit=100"
        )
        results = fetch_open5e_pages(first_url)
        index[endpoint] = {"count": len(results)}
        write_json(
            directory / f"{endpoint}.json",
            {
                "source": OPEN5E,
                "documentKey": document_key,
                "endpoint": endpoint,
                "results": results,
            },
        )

    write_json(directory / "index.json", index)


def fetch_open5e_pages(first_url: str) -> list[Any]:
    results: list[Any] = []
    next_url: str | None = first_url

    while next_url:
        page = fetch_json(next_url)
        results.extend(page.get("results", []))
        next_url = page.get("next")

    return results


def fetch_json(url: str) -> Any:
    request = Request(url, headers={"Accept": "application/json"})
    with urlopen(request, timeout=30) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"{response.status} {response.reason}: {url}")
        return json.load(response)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{json.dumps(data, indent=2)}\n", encoding="utf-8")


def write_supplements(data_dir: Path) -> None:
    for ruleset, files in SUPPLEMENTS.items():
        ruleset_dir = data_dir / "supplements" / ruleset
        ruleset_dir.mkdir(parents=True, exist_ok=True)
        for name, data in files.items():
            write_json(ruleset_dir / f"{name}.json", data)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    main()
