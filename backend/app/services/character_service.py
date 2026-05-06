from __future__ import annotations

from app.domain.character.character_projection import derive_character_sheet
from app.domain.engine.action_engine import derive_available_actions


class CharacterService:
    def project(self, character: dict, options: dict | None = None) -> dict:
        return derive_character_sheet(character, options or {})

    def actions(self, character: dict, context: dict | None = None) -> list[dict]:
        payload = dict(context or {})
        payload["character"] = character
        return derive_available_actions(payload)

    def validate(self, character: dict, options: dict | None = None) -> dict:
        try:
            projection = self.project(character, options or {})
        except Exception as exc:  # pragma: no cover - defensive contract
            return {"valid": False, "errors": [str(exc)], "projection": None}

        return {"valid": True, "errors": [], "projection": projection}
