"""Minimal formula evaluation helpers ported from the frontend engine."""

import math
import re

OPERATORS = {
    "+": (1, lambda left, right: left + right),
    "-": (1, lambda left, right: left - right),
    "*": (2, lambda left, right: left * right),
    "/": (2, lambda left, right: left / right),
}

TOKEN_PATTERN = re.compile(r"@[a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|[()+\-*/]")


def evaluate_formula(
    formula: str | int | float, context: dict[str, float] | None = None
) -> float:
    if isinstance(formula, (int, float)):
        return float(formula)
    if not formula:
        return 0

    context = context or {}
    tokens = _tokenize(formula)
    output: list[str] = []
    operators: list[str] = []

    for token in tokens:
        if token.startswith("@") or token.replace(".", "", 1).isdigit():
            output.append(token)
            continue
        if token == "(":
            operators.append(token)
            continue
        if token == ")":
            while operators and operators[-1] != "(":
                output.append(operators.pop())
            if not operators:
                raise ValueError(f"Invalid formula: {formula}")
            operators.pop()
            continue

        precedence = OPERATORS[token][0]
        while (
            operators
            and operators[-1] in OPERATORS
            and OPERATORS[operators[-1]][0] >= precedence
        ):
            output.append(operators.pop())
        operators.append(token)

    while operators:
        operator = operators.pop()
        if operator == "(":
            raise ValueError(f"Invalid formula: {formula}")
        output.append(operator)

    stack: list[float] = []
    for token in output:
        if token.startswith("@"):
            stack.append(_numeric_value(context.get(token[1:], 0)))
        elif token.replace(".", "", 1).isdigit():
            stack.append(float(token))
        else:
            if len(stack) < 2:
                raise ValueError("Invalid formula expression")
            right = stack.pop()
            left = stack.pop()
            stack.append(OPERATORS[token][1](left, right))

    if len(stack) != 1:
        raise ValueError("Invalid formula expression")

    return stack[0]


def _tokenize(formula: str) -> list[str]:
    tokens: list[str] = []
    cursor = 0

    for match in TOKEN_PATTERN.finditer(formula):
        if formula[cursor:match.start()].strip():
            fragment = formula[cursor:]
            raise ValueError(f"Unsupported formula token near: {fragment}")
        tokens.append(match.group())
        cursor = match.end()

    if formula[cursor:].strip():
        fragment = formula[cursor:]
        raise ValueError(f"Unsupported formula token near: {fragment}")

    return tokens


def _numeric_value(value: object) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    return number if math.isfinite(number) else 0.0
