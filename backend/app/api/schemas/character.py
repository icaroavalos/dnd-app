from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class CharacterProjectRequest(BaseModel):
    character: dict[str, Any]
    options: dict[str, Any] = Field(default_factory=dict)


class CharacterActionsRequest(BaseModel):
    character: dict[str, Any]
    context: dict[str, Any] = Field(default_factory=dict)


class CharacterActionsResponse(BaseModel):
    results: list[dict[str, Any]]


class CharacterValidationResponse(BaseModel):
    valid: bool
    errors: list[str]
    projection: dict[str, Any] | None = None


class FormulaEvaluateRequest(BaseModel):
    formula: str | int | float
    context: dict[str, Any] = Field(default_factory=dict)


class FormulaEvaluateResponse(BaseModel):
    result: float
