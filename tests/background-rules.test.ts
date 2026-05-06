/**
 * Background Rules Tests
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { loadBackgroundData, getBackgroundsBySource } from '../src/core/character/background-loader.js';
import { backgroundChoiceRules, hasMagicInitiate, getMagicInitiateClass } from '../src/core/character/background-rules.js';

describe('Background Rules', () => {
  before(async () => {
    await loadBackgroundData();
  });

  describe('backgroundChoiceRules', () => {
    it('should generate rules for Acolyte', () => {
      const rules = backgroundChoiceRules('Acolyte', 'XPHB');

      assert.ok(rules.length > 0, 'Should have at least one rule');

      const abilityRule = rules.find((r) => r.type === 'ability');
      assert.ok(abilityRule, 'Should have ability rule');
      assert.ok(abilityRule.options.some((o) => o.value === 'int'), 'Should include INT option');
      assert.ok(abilityRule.options.some((o) => o.value === 'wis'), 'Should include WIS option');
      assert.ok(abilityRule.options.some((o) => o.value === 'cha'), 'Should include CHA option');

      const skillRule = rules.find((r) => r.type === 'skill');
      assert.ok(skillRule, 'Should have skill rule');
      assert.strictEqual(skillRule.required, 2, 'Acolyte has 2 skills');

      const equipmentRule = rules.find((r) => r.type === 'equipment');
      assert.ok(equipmentRule, 'Should have equipment rule');
      assert.strictEqual(equipmentRule.options.length, 2, 'Should have A and B options');
    });

    it('should return empty array for non-existent background', () => {
      const rules = backgroundChoiceRules('NonExistent', 'XPHB');
      assert.deepStrictEqual(rules, []);
    });

    it('should generate tool proficiency rule for Acolyte', () => {
      const rules = backgroundChoiceRules('Acolyte', 'XPHB');

      const toolRule = rules.find((r) => r.type === 'tool');
      assert.ok(toolRule, 'Should have tool rule');
      assert.ok(toolRule.options.length > 0, 'Should have tool options');
      assert.strictEqual(toolRule.required, 1, 'Acolyte has 1 tool proficiency');
    });
  });

  describe('hasMagicInitiate', () => {
    it('should return true for Acolyte (has Magic Initiate: Cleric)', () => {
      const result = hasMagicInitiate('Acolyte', 'XPHB');
      assert.strictEqual(result, true, 'Acolyte should have Magic Initiate');
    });

    it('should return false for non-magic initiate backgrounds', () => {
      const backgrounds = getBackgroundsBySource();
      const nonMagicBackground = backgrounds.find((bg) => {
        return !hasMagicInitiate(bg.name, bg.source);
      });

      assert.ok(nonMagicBackground, 'Should find at least one background without Magic Initiate');
    });
  });

  describe('getMagicInitiateClass', () => {
    it('should return "Cleric" for Acolyte', () => {
      const result = getMagicInitiateClass('Acolyte', 'XPHB');
      assert.strictEqual(result?.toLowerCase(), 'cleric', 'Acolyte should give Cleric Magic Initiate');
    });

    it('should return null for backgrounds without Magic Initiate', () => {
      const result = getMagicInitiateClass('NonExistent', 'XPHB');
      assert.strictEqual(result, null);
    });
  });
});