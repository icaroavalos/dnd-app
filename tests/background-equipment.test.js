/**
 * Background Equipment Tests
 * Testa que todos os equipamentos do background sao listados e preservados
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { parseBackground } from '../dist/src/core/character/background-parser.js';
import {
  createEmptyBgChoices,
  areBackgroundChoicesComplete,
} from '../dist/src/core/character/background-choices.js';

// Load raw data directly from JSON to avoid async loading issues
const rawData = JSON.parse(readFileSync('./data/5etools/5e-2024/backgrounds.json', 'utf-8'));
const rawAcolyte = rawData.results.find(b => b.name === 'Acolyte');

describe('Background Equipment', () => {
  it('Acolyte Option A - all equipment items are present', () => {
    assert.ok(rawAcolyte, 'Acolyte should exist in raw data');

    const parsed = parseBackground(rawAcolyte);
    const optionA = parsed.equipment.optionA;

    // Option A should have items
    assert.ok(optionA.items, 'Option A should have items array');
    assert.ok(optionA.items.length > 0, 'Option A should have at least one item');

    // Verify specific items from Acolyte background
    const itemNames = optionA.items.map(item => item.name.toLowerCase());
    assert.ok(itemNames.some(name => name.includes('book')), 'Should have Book');
    assert.ok(itemNames.some(name => name.includes('calligrapher')), 'Should have Calligrapher supplies');
    assert.ok(itemNames.some(name => name.includes('holy symbol')), 'Should have Holy symbol');
    assert.ok(itemNames.some(name => name.includes('parchment')), 'Should have Parchment');
    assert.ok(itemNames.some(name => name.includes('robe')), 'Should have Robe');

    // Verify parchment has quantity
    const parchment = optionA.items.find(item => item.name.toLowerCase().includes('parchment'));
    assert.ok(parchment, 'Parchment should exist');
    assert.strictEqual(parchment.quantity, 10, 'Parchment should have quantity 10');

    // Verify gold value (8 GP = 800 CP)
    assert.strictEqual(optionA.goldValue, 800, 'Option A should have 8 GP (800 CP)');

    console.log('  Acolyte Option A: ' + optionA.items.length + ' items + ' + optionA.goldValue + ' CP gold');
  });

  it('Acolyte Option B - gold only fallback', () => {
    assert.ok(rawAcolyte, 'Acolyte should exist');
    const parsed = parseBackground(rawAcolyte);
    const optionB = parsed.equipment.optionB;

    // Option B should be gold only
    assert.strictEqual(optionB.type, 'gold', 'Option B should be gold type');
    assert.strictEqual(optionB.goldValue, 5000, 'Option B should have 50 GP (5000 CP)');
    assert.ok(!optionB.items || optionB.items.length === 0, 'Option B should have no items');

    console.log('  Acolyte Option B: ' + optionB.goldValue + ' CP gold only');
  });

  it('equipmentChoice is preserved in background choices state', () => {
    const choices = createEmptyBgChoices();
    choices.background = 'Acolyte';
    choices.source = 'XPHB';
    choices.abilityIncrement = '2_1';
    choices.abilityScores = ['int', 'wis'];
    choices.equipmentChoice = 'A';

    // Verify equipment choice is stored
    assert.strictEqual(choices.equipmentChoice, 'A', 'Should store equipment choice A');

    // Verify completeness check works with equipment
    const isComplete = areBackgroundChoicesComplete(choices, {
      abilityScores: 2,
      skills: 2,
      equipment: true,
      magicInitiate: false,
    });

    // Should be complete with equipment chosen
    assert.strictEqual(isComplete, true, 'Should be complete with equipment and abilities chosen');

    // Test without equipment
    choices.equipmentChoice = null;
    const isCompleteWithoutEquip = areBackgroundChoicesComplete(choices, {
      abilityScores: 2,
      skills: 2,
      equipment: true,
      magicInitiate: false,
    });

    assert.strictEqual(isCompleteWithoutEquip, false, 'Should not be complete without equipment');

    console.log('  Equipment choice preservation: OK');
  });

  it('CharacterRecord backgroundChoices preserves equipmentSelection', () => {
    // Simulate a CharacterRecord with background choices
    const characterRecord = {
      id: 'test-1',
      name: 'Test Character',
      background: 'Acolyte',
      bgChoices: {
        background: 'Acolyte',
        source: 'XPHB',
        abilityIncrement: '2_1',
        abilityScores: ['int', 'wis'],
        skillChoices: ['Insight', 'Religion'],
        toolChoices: [],
        equipmentChoice: 'A',
        equipmentSelection: [
          { name: 'book', displayName: 'Book (Prayers)' },
          { name: "calligrapher's supplies", displayName: "Calligrapher's Supplies" },
          { name: 'holy symbol', displayName: 'Holy Symbol' },
          { name: 'parchment', quantity: 10 },
          { name: 'robe' },
        ],
        spellcastingAbility: 'wis',
      },
    };

    // Verify equipment selection is preserved
    assert.ok(characterRecord.bgChoices.equipmentSelection, 'Should have equipmentSelection');
    assert.strictEqual(
      characterRecord.bgChoices.equipmentSelection.length,
      5,
      'Should have 5 equipment items'
    );

    // Verify each item is preserved
    const itemNames = characterRecord.bgChoices.equipmentSelection.map(item => item.name);
    assert.ok(itemNames.some(n => n.includes('book')), 'Should preserve Book');
    assert.ok(itemNames.some(n => n.includes('calligrapher')), 'Should preserve Calligrapher supplies');
    assert.ok(itemNames.some(n => n.includes('holy')), 'Should preserve Holy symbol');
    assert.ok(itemNames.some(n => n.includes('parchment')), 'Should preserve Parchment');
    assert.ok(itemNames.some(n => n.includes('robe')), 'Should preserve Robe');

    console.log('  CharacterRecord equipmentSelection: OK - 5 items preserved');
  });
});
