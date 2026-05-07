import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const engineModule = await import('../dist/src/core/character/character-engine.js');

describe('character engine', () => {
  it('derives total ability scores and modifiers from base scores plus bonuses', () => {
    assert.equal(typeof engineModule.deriveAbilityScores, 'function');
    assert.equal(typeof engineModule.deriveAbilityModifier, 'function');
    assert.equal(typeof engineModule.deriveProficiencyBonus, 'function');
    assert.equal(typeof engineModule.deriveSavingThrowBonus, 'function');

    const scores = engineModule.deriveAbilityScores(
      { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      { str: 0, dex: 0, con: 1, int: 1, wis: 2, cha: 0 }
    );

    assert.deepEqual(scores, {
      str: 15,
      dex: 14,
      con: 14,
      int: 13,
      wis: 12,
      cha: 8,
    });
    assert.equal(engineModule.deriveAbilityModifier(scores.wis), 1);
    assert.equal(engineModule.deriveAbilityModifier(scores.con), 2);
    assert.equal(engineModule.deriveProficiencyBonus(5), 3);
    assert.equal(engineModule.deriveSavingThrowBonus(scores.con, true, 2), 4);
  });

  it('derives spellcasting metrics from the chosen spellcasting ability', () => {
    assert.equal(typeof engineModule.deriveSpellcastingMetrics, 'function');

    const metrics = engineModule.deriveSpellcastingMetrics('cha', {
      str: 10,
      dex: 10,
      con: 10,
      int: 12,
      wis: 14,
      cha: 16,
    }, 2);

    assert.deepEqual(metrics, {
      ability: 'cha',
      score: 16,
      modifier: 3,
      attackBonus: 5,
      saveDc: 13,
    });
  });

  it('derives max HP for level 1 from hit die and constitution score', () => {
    assert.equal(typeof engineModule.deriveLevelOneMaxHp, 'function');
    assert.equal(engineModule.deriveLevelOneMaxHp(10, 14), 12);
    assert.equal(engineModule.deriveLevelOneMaxHp(6, 8), 5);
  });
});
