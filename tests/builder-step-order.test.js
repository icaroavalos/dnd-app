import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function normalize(value) {
  return value.replace(/\s+/g, ' ');
}

describe('builder step order', () => {
  it('keeps Background as the second builder step in app.js', () => {
    const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
    const normalized = normalize(source);

    assert.match(
      normalized,
      /const STEPS = \[\s*\["lineage", "Origem"\],\s*\["background", "Background"\],\s*\["abilities", "Atributos"\],\s*\["choices", "Escolhas"\],\s*\["leveling", "Niveis"\],\s*\];/
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
});
