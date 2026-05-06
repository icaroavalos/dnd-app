from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.api.schemas.character import (
    CharacterActionsRequest,
    CharacterActionsResponse,
    CharacterProjectRequest,
    CharacterValidationResponse,
)
from app.services.character_service import CharacterService

router = APIRouter(prefix="/api/characters", tags=["characters"])
service = CharacterService()


@router.post("/project")
def project_character(payload: CharacterProjectRequest) -> dict[str, Any]:
    return service.project(payload.character, payload.options)


@router.post("/actions", response_model=CharacterActionsResponse)
def character_actions(payload: CharacterActionsRequest) -> CharacterActionsResponse:
    context = dict(payload.context)
    if "projection" not in context:
        context["projection"] = service.project(
            payload.character,
            context.get("options") or {},
        )
    return CharacterActionsResponse(
        results=service.actions(payload.character, context),
    )


@router.post("/validate", response_model=CharacterValidationResponse)
def validate_character(
    payload: CharacterProjectRequest,
) -> CharacterValidationResponse:
    return CharacterValidationResponse(
        **service.validate(payload.character, payload.options)
    )
