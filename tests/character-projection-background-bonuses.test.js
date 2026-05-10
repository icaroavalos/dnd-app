import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveCharacterSheet } from '../dist/src/core/character/character-projection.js';

describe('character projection background bonuses', () => {
  it('applies Acolyte background ability choices to derived scores', () => {
    const sheet = deriveCharacterSheet({
      level: 1,
      class: 'fighter',
      abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      savingThrows: ['str', 'con'],
      skillProficiencies: [],
      asiChoices: {},
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
    }, {
      skills: [],
      abilityKeys: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
      modifiers: [],
      defaultHitDie: 10,
    });

    assert.equal(sheet.abilityScores.int, 13);
    assert.equal(sheet.abilityScores.wis, 12);
    assert.equal(sheet.abilityModifiers.int, 1);
    assert.equal(sheet.abilityModifiers.wis, 1);
  });
});
