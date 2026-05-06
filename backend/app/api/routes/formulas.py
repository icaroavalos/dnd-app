from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.api.schemas.character import FormulaEvaluateRequest, FormulaEvaluateResponse
from app.domain.engine.expression_evaluator import evaluate_formula

router = APIRouter(prefix="/api/formulas", tags=["formulas"])


@router.post("/evaluate", response_model=FormulaEvaluateResponse)
def evaluate(payload: FormulaEvaluateRequest) -> FormulaEvaluateResponse:
    try:
        result = evaluate_formula(payload.formula, payload.context)
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FormulaEvaluateResponse(result=result)
