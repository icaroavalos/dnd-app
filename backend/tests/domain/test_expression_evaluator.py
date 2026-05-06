import pytest

from app.domain.engine.expression_evaluator import evaluate_formula


def test_evaluate_formula_supports_prof_and_ability_modifiers() -> None:
    result = evaluate_formula("8 + @prof + @wis_mod", {"prof": 3, "wis_mod": 4})

    assert result == 15


def test_evaluate_formula_supports_compact_formulas_without_spaces() -> None:
    result = evaluate_formula("8+@prof", {"prof": 3})

    assert result == 11


def test_evaluate_formula_respects_operator_precedence_and_parentheses() -> None:
    result = evaluate_formula("( 2 + 3 ) * 4")

    assert result == 20


def test_evaluate_formula_uses_zero_for_missing_variables() -> None:
    result = evaluate_formula("10 + @missing")

    assert result == 10


def test_evaluate_formula_treats_malformed_variable_values_as_zero() -> None:
    result = evaluate_formula(
        "10 + @empty + @text + @none",
        {"empty": "", "text": "abc", "none": None},
    )

    assert result == 10


def test_evaluate_formula_rejects_unsupported_fragments() -> None:
    with pytest.raises(ValueError, match="Unsupported formula token near:"):
        evaluate_formula("8 + foo")


def test_evaluate_formula_rejects_mismatched_parentheses() -> None:
    with pytest.raises(ValueError, match=r"Invalid formula:"):
        evaluate_formula("(8 + 2")

    with pytest.raises(ValueError, match=r"Invalid formula:"):
        evaluate_formula("8 + )")
