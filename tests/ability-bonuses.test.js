import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const bonusesModule = await import('../dist/src/core/character/ability-bonuses.js');

describe('ability bonuses', () => {
  it('applies Acolyte +2/+1 selections in order', () => {
    const { calculateBackgroundAbilityBonuses } = bonusesModule;

    const bonuses = calculateBackgroundAbilityBonuses({
      background: 'Acolyte',
      source: 'XPHB',
      abilityIncrement: '2_1',
      abilityScores: ['wis', 'int'],
      skillChoices: [],
      toolChoices: [],
      equipmentChoice: 'A',
      spellcastingAbility: 'wis',
    });

    assert.deepEqual(bonuses, {
      str: 0,
      dex: 0,
      con: 0,
      int: 1,
      wis: 2,
      cha: 0,
    });
  });

  it('applies the first +2 choice immediately before the second pick is made', () => {
    const { calculateBackgroundAbilityBonuses } = bonusesModule;

    const bonuses = calculateBackgroundAbilityBonuses({
      background: 'Acolyte',
      source: 'XPHB',
      abilityIncrement: '2_1',
      abilityScores: ['wis'],
      skillChoices: [],
      toolChoices: [],
      equipmentChoice: 'A',
      spellcastingAbility: 'wis',
    });

    assert.deepEqual(bonuses, {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 2,
      cha: 0,
    });
  });

  it('applies +1/+1/+1 to three selected abilities', () => {
    const { calculateBackgroundAbilityBonuses } = bonusesModule;

    const bonuses = calculateBackgroundAbilityBonuses({
      background: 'Acolyte',
      source: 'XPHB',
      abilityIncrement: '1_1_1',
      abilityScores: ['int', 'wis', 'cha'],
      skillChoices: [],
      toolChoices: [],
      equipmentChoice: 'A',
      spellcastingAbility: 'wis',
    });

    assert.deepEqual(bonuses, {
      str: 0,
      dex: 0,
      con: 0,
      int: 1,
      wis: 1,
      cha: 1,
    });
  });

  it('combines background and ASI bonuses into one character map', () => {
    const { calculateCharacterAbilityBonuses } = bonusesModule;

    const bonuses = calculateCharacterAbilityBonuses({
      bgChoices: {
        background: 'Acolyte',
        source: 'XPHB',
        abilityIncrement: '2_1',
        abilityScores: ['wis', 'int'],
        skillChoices: [],
        toolChoices: [],
        equipmentChoice: 'A',
        spellcastingAbility: 'wis',
      },
      asiChoices: {
        featA: {
          mode: 'asi',
          pattern: 'plus1plus1',
          ability1: 'con',
          ability2: 'wis',
        },
      },
    });

    assert.deepEqual(bonuses, {
      str: 0,
      dex: 0,
      con: 1,
      int: 1,
      wis: 3,
      cha: 0,
    });
  });
});
