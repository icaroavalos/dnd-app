from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class JsonLoader:
    def __init__(self, root: Path | None = None) -> None:
        self.root = root or Path(__file__).resolve().parents[4]

    def load(self, relative_path: str) -> Any:
        file_path = self.root / relative_path
        with file_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
