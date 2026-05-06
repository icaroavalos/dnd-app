from __future__ import annotations

from app.infrastructure.cache.memory_cache import MemoryCache
from app.infrastructure.loaders.json_loader import JsonLoader


class DataRepository:
    def __init__(
        self,
        loader: JsonLoader | None = None,
        cache: MemoryCache | None = None,
    ) -> None:
        self.loader = loader or JsonLoader()
        self.cache = cache or MemoryCache()

    def get_manifest(self) -> dict:
        return self._cached("manifest", "data/manifest.json")

    def list_rulesets(self) -> list[str]:
        manifest = self.get_manifest()
        return sorted((manifest.get("rulesets") or {}).keys())

    def get_ruleset_file(self, ruleset: str, name: str) -> dict:
        return self._cached(f"{ruleset}:{name}", f"data/5etools/{ruleset}/{name}.json")

    def _cached(self, key: str, path: str) -> dict:
        cached = self.cache.get(key)
        if cached is not None:
            return cached
        return self.cache.set(key, self.loader.load(path))
