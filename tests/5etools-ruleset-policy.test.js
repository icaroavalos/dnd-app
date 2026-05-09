import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readCompactData(name) {
  return JSON.parse(readFileSync(`./data/5etools/5e-2024/${name}.json`, 'utf8')).results;
}

describe('5etools 2024 ruleset source policy', () => {
  it('includes MPMM only for species/races data', () => {
    const races = readCompactData('races');
    const backgrounds = readCompactData('backgrounds');
    const equipment = readCompactData('equipment');
    const feats = readCompactData('feats');
    const spells = readCompactData('spells');

    assert.ok(races.some((race) => race.source === 'MPMM'), 'MPMM races should be available in the 2024 species catalog');
    assert.equal(backgrounds.some((background) => background.source === 'MPMM'), false, 'MPMM backgrounds should not be added');
    assert.equal(equipment.some((item) => item.source === 'MPMM'), false, 'MPMM equipment should not be added');
    assert.equal(feats.some((feat) => feat.source === 'MPMM'), false, 'MPMM feats should not be added');
    assert.equal(spells.some((spell) => spell.source === 'MPMM'), false, 'MPMM spells should not be added');
  });
});
