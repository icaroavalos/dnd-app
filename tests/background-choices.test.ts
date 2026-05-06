/**
 * Background Choices Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createEmptyBgChoices,
  resetChoicesForBackground,
  getAbilityIncrements,
  calculateBackgroundAbilityBonuses,
  getMissingBackgroundChoices,
  validateAbilitySelection,
} from '../src/core/character/background-choices.js';
import type { AbilityName } from '../src/types/background.js';

describe('Background Choices', () => {
  describe('createEmptyBgChoices', () => {
    it('should create an empty choices object', () => {
      const choices = createEmptyBgChoices();

      assert.strictEqual(choices.background, null);
      assert.strictEqual(choices.source, 'XPHB');
      assert.strictEqual(choices.abilityIncrement, null);
      assert.deepStrictEqual(choices.abilityScores, []);
      assert.deepStrictEqual(choices.skillChoices, []);
      assert.strictEqual(choices.equipmentChoice, null);
    });
  });

  describe('getAbilityIncrements', () => {
    it('should return zero increments for null pattern', () => {
      const increments = getAbilityIncrements(null, []);

      assert.strictEqual(increments.int, 0);
      assert.strictEqual(increments.wis, 0);
      assert.strictEqual(increments.cha, 0);
    });

    it('should calculate +2/+1 pattern correctly', () => {
      const scores: AbilityName[] = ['int', 'wis'];
      const increments = getAbilityIncrements('2_1', scores);

      assert.strictEqual(increments.int, 2, 'INT should get +2');
      assert.strictEqual(increments.wis, 1, 'WIS should get +1');
      assert.strictEqual(increments.cha, 0, 'CHA should get 0');
    });

    it('should calculate +1/+1/+1 pattern correctly', () => {
      const scores: AbilityName[] = ['int', 'wis', 'cha'];
      const increments = getAbilityIncrements('1_1_1', scores);

      assert.strictEqual(increments.int, 1, 'INT should get +1');
      assert.strictEqual(increments.wis, 1, 'WIS should get +1');
      assert.strictEqual(increments.cha, 1, 'CHA should get +1');
    });

    it('should handle insufficient scores for +2/+1', () => {
      const scores: AbilityName[] = ['int'];
      const increments = getAbilityIncrements('2_1', scores);

      assert.strictEqual(increments.int, 0, 'Should not apply bonuses with insufficient scores');
    });
  });

  describe('validateAbilitySelection', () => {
    it('should validate +2/+1 pattern with 2 scores', () => {
      const result = validateAbilitySelection(['int', 'wis'], '2_1');
      assert.strictEqual(result.valid, true);
    });

    it('should reject +2/+1 pattern with only 1 score', () => {
      const result = validateAbilitySelection(['int'], '2_1');
      assert.strictEqual(result.valid, false);
      assert.ok(result.message && result.message.includes('2 ability scores'));
    });

    it('should reject duplicate selections', () => {
      const result = validateAbilitySelection(['int', 'int', 'wis'], '2_1');
      assert.strictEqual(result.valid, false);
      assert.ok(result.message && result.message.includes('once'));
    });

    it('should validate +1/+1/+1 pattern with 3 scores', () => {
      const result = validateAbilitySelection(['int', 'wis', 'cha'], '1_1_1');
      assert.strictEqual(result.valid, true);
    });

    it('should accept null pattern as valid', () => {
      const result = validateAbilitySelection([], null);
      assert.strictEqual(result.valid, true);
    });
  });

  describe('getMissingBackgroundChoices', () => {
    it('should return background as missing if not selected', () => {
      const choices = createEmptyBgChoices();
      const missing = getMissingBackgroundChoices(choices, {
        abilityScores: 2,
        skills: 2,
        equipment: true,
        magicInitiate: false,
      });

      assert.ok(missing.includes('background'));
    });

    it('should return ability scores if not selected', () => {
      const choices = createEmptyBgChoices();
      choices.background = 'acolyte';
      choices.abilityScores = ['int']; // Only 1 of required 2

      const missing = getMissingBackgroundChoices(choices, {
        abilityScores: 2,
        skills: 0,
        equipment: false,
        magicInitiate: false,
      });

      assert.ok(missing.some((m) => m.includes('ability scores')));
    });

    it('should return empty if all choices complete', () => {
      const choices = createEmptyBgChoices();
      choices.background = 'acolyte';
      choices.abilityScores = ['int', 'wis'];
      choices.equipmentChoice = 'A';

      const missing = getMissingBackgroundChoices(choices, {
        abilityScores: 2,
        skills: 2,
        equipment: true,
        magicInitiate: false,
      });

      assert.strictEqual(missing.length, 0);
    });
  });
});