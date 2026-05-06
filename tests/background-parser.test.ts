/**
 * Background Parser Tests
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { loadBackgroundData, getBackground, getBackgroundsBySource } from '../src/core/character/background-loader.js';
import { parseBackground } from '../src/core/character/background-parser.js';

describe('Background Parser', () => {
  before(async () => {
    await loadBackgroundData();
  });

  it('should parse XPHB Acolyte correctly', async () => {
    const rawAcolyte = getBackground('Acolyte', 'XPHB');
    assert.ok(rawAcolyte, 'Acolyte should exist in XPHB');

    const parsed = parseBackground(rawAcolyte);

    assert.strictEqual(parsed.name, 'Acolyte');
    assert.strictEqual(parsed.source, 'XPHB');
    assert.ok(parsed.abilityScores.length > 0, 'Should have ability score choices');
    assert.deepStrictEqual(
      parsed.skillProficiencies,
      ['insight', 'religion'],
      'Should have Insight and Religion skills'
    );
    assert.ok(parsed.toolProficiencies.length > 0, 'Should have tool proficiencies');
    assert.ok(parsed.equipment.optionA, 'Should have option A');
    assert.ok(parsed.equipment.optionB, 'Should have option B');
    assert.ok(parsed.magicInitiate, 'Acolyte should have Magic Initiate feat');
    assert.strictEqual(
      parsed.magicInitiate.className.toLowerCase(),
      'cleric',
      'Should be Cleric'
    );
  });

  it('should extract ability options with weights', async () => {
    const rawAcolyte = getBackground('Acolyte', 'XPHB');
    assert.ok(rawAcolyte, 'Acolyte should exist');
    const parsed = parseBackground(rawAcolyte);

    const firstAbility = parsed.abilityScores[0];
    assert.strictEqual(firstAbility.type, 'weighted', 'Should be weighted type');
    assert.ok(firstAbility.options.includes('int'), 'Should include INT');
    assert.ok(firstAbility.options.includes('wis'), 'Should include WIS');
    assert.ok(firstAbility.options.includes('cha'), 'Should include CHA');
    assert.ok(firstAbility.weights, 'Should have weights array');
    assert.strictEqual(firstAbility.weights.length, 2, 'Should have 2 weight groups');
  });

  it('should parse equipment with gold fallback', async () => {
    const rawAcolyte = getBackground('Acolyte', 'XPHB');
    assert.ok(rawAcolyte, 'Acolyte should exist');
    const parsed = parseBackground(rawAcolyte);

    const optionA = parsed.equipment.optionA;
    const optionB = parsed.equipment.optionB;

    // Option A has items + gold value (8 GP), Option B is gold only (50 GP)
    assert.strictEqual(optionB.type, 'gold', 'Option B should be gold only');
    assert.strictEqual(optionB.goldValue, 5000, 'Option B should have 50 GP');
    // Option A has both items and gold (mixed type)
    assert.ok(optionA.items && optionA.items.length > 0, 'Option A should have items');
    assert.strictEqual(optionA.goldValue, 800, 'Option A gold value should be 8 GP (800 cp)');
  });

  it('should handle backgrounds without Magic Initiate', async () => {
    const backgrounds = getBackgroundsBySource();
    const nonMagicBackground = backgrounds.find((bg) => {
      const parsed = parseBackground(bg);
      return !parsed.magicInitiate;
    });

    assert.ok(nonMagicBackground, 'Should find at least one background without Magic Initiate');
    const parsed = parseBackground(nonMagicBackground);
    assert.strictEqual(parsed.magicInitiate, null, 'Should have no magic initiate');
  });
});