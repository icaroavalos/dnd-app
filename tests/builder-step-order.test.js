import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function normalize(value) {
  return value.replace(/\s+/g, ' ');
}

describe('builder step order', () => {
  it('reads the builder step order from the TypeScript flow module in app.js', () => {
    const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
    const normalized = normalize(source);

    assert.match(
      normalized,
      /import \{ CREATION_STEPS, .* \} from "\.\/dist\/src\/core\/state\/creation-flow\.js";/
    );
    assert.match(
      normalized,
      /const STEPS = CREATION_STEPS;/
    );
  });

  it('includes background in the TypeScript builder step union', () => {
    const source = readFileSync(new URL('../src/types/state.ts', import.meta.url), 'utf8');
    const normalized = normalize(source);

    assert.match(
      normalized,
      /export type BuilderStepId = 'lineage' \| 'background' \| 'abilities' \| 'choices' \| 'leveling';/
    );
  });

  it('keeps Background as the second step in the TypeScript flow module', () => {
    const source = readFileSync(new URL('../src/core/state/creation-flow.ts', import.meta.url), 'utf8');
    const normalized = normalize(source);

    assert.match(
      normalized,
      /export const CREATION_STEPS: \[BuilderStepId, string\]\[] = \[\s*\['lineage', 'Origem'\],\s*\['background', 'Background'\],\s*\['abilities', 'Atributos'\],\s*\['choices', 'Escolhas'\],\s*\['leveling', 'Niveis'\],\s*\];/
    );
  });
});
