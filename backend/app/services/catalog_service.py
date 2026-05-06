from app.infrastructure.repositories.data_repository import DataRepository


class CatalogService:
    def __init__(self, repository: DataRepository) -> None:
        self.repository = repository

    def list_rulesets(self) -> list[str]:
        return self.repository.list_rulesets()

    def get_manifest(self) -> dict:
        return self.repository.get_manifest()

    def get_catalog(self, ruleset: str, name: str) -> dict:
        self._ensure_ruleset_exists(ruleset)
        payload = self.repository.get_ruleset_file(ruleset, name)
        return {"ruleset": ruleset, "results": payload.get("results", [])}

    def get_features_catalog(self, ruleset: str) -> dict:
        self._ensure_ruleset_exists(ruleset)
        class_features = self.repository.get_ruleset_file(ruleset, "class-features")
        subclass_features = self.repository.get_ruleset_file(
            ruleset, "subclass-features"
        )
        return {
            "ruleset": ruleset,
            "results": [
                *class_features.get("results", []),
                *subclass_features.get("results", []),
            ],
        }

    def _ensure_ruleset_exists(self, ruleset: str) -> None:
        if ruleset not in self.repository.list_rulesets():
            raise FileNotFoundError(f"Unknown ruleset: {ruleset}")
