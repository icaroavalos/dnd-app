const OPERATORS = {
  "+": { precedence: 1, apply: (left, right) => left + right },
  "-": { precedence: 1, apply: (left, right) => left - right },
  "*": { precedence: 2, apply: (left, right) => left * right },
  "/": { precedence: 2, apply: (left, right) => left / right },
};

export function createFormulaContext(characterProjection) {
  const abilityModifiers = characterProjection?.abilityModifiers ?? {};
  return {
    prof: characterProjection?.proficiencyBonus ?? 0,
    proficiency: characterProjection?.proficiencyBonus ?? 0,
    str_mod: abilityModifiers.str ?? 0,
    dex_mod: abilityModifiers.dex ?? 0,
    con_mod: abilityModifiers.con ?? 0,
    int_mod: abilityModifiers.int ?? 0,
    wis_mod: abilityModifiers.wis ?? 0,
    cha_mod: abilityModifiers.cha ?? 0,
  };
}

export function evaluateFormula(formula, context = {}) {
  if (typeof formula === "number") return formula;
  if (!formula || typeof formula !== "string") return 0;

  const tokens = tokenize(formula);
  const output = [];
  const operators = [];

  tokens.forEach((token) => {
    if (token.type === "number" || token.type === "variable") {
      output.push(token);
      return;
    }

    if (token.value === "(") {
      operators.push(token);
      return;
    }

    if (token.value === ")") {
      while (operators.length && operators.at(-1).value !== "(") output.push(operators.pop());
      if (!operators.length) throw new Error(`Invalid formula: ${formula}`);
      operators.pop();
      return;
    }

    const current = OPERATORS[token.value];
    while (operators.length) {
      const previous = OPERATORS[operators.at(-1).value];
      if (!previous || previous.precedence < current.precedence) break;
      output.push(operators.pop());
    }
    operators.push(token);
  });

  while (operators.length) {
    const operator = operators.pop();
    if (operator.value === "(") throw new Error(`Invalid formula: ${formula}`);
    output.push(operator);
  }

  return evaluateRpn(output, context);
}

function tokenize(formula) {
  const tokens = [];
  const pattern = /\s*(@[a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|[()+\-*/])\s*/g;
  let match;
  let cursor = 0;

  while ((match = pattern.exec(formula))) {
    if (match.index !== cursor) throw new Error(`Unsupported formula token near: ${formula.slice(cursor)}`);
    cursor = pattern.lastIndex;
    const value = match[1];
    if (/^\d/.test(value)) tokens.push({ type: "number", value: Number(value) });
    else if (value.startsWith("@")) tokens.push({ type: "variable", value: value.slice(1) });
    else tokens.push({ type: "operator", value });
  }

  if (cursor !== formula.length) throw new Error(`Unsupported formula token near: ${formula.slice(cursor)}`);
  return tokens;
}

function evaluateRpn(tokens, context) {
  const stack = [];

  tokens.forEach((token) => {
    if (token.type === "number") {
      stack.push(token.value);
      return;
    }
    if (token.type === "variable") {
      const value = Number(context[token.value]);
      stack.push(Number.isFinite(value) ? value : 0);
      return;
    }

    const right = stack.pop();
    const left = stack.pop();
    if (!Number.isFinite(left) || !Number.isFinite(right)) throw new Error("Invalid formula expression");
    stack.push(OPERATORS[token.value].apply(left, right));
  });

  if (stack.length !== 1) throw new Error("Invalid formula expression");
  return stack[0];
}
