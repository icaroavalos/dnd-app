import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const module = await import('../dist/src/core/character/local-character-projection.js');

describe('character projection helpers', () => {
  it('derives typed helper values for ability scores, saves, skills, and proficiency', () => {
    const character = {
      level: 5,
      class: 'druid',
      abilities: { str: 10, dex: 14, con: 12, int: 8, wis: 16, cha: 10 },
      savingThrows: ['int', 'wis'],
      skillProficiencies: ['Arcana', 'Perception'],
      classFeatureChoices: {
        'primal-order': 'magician',
        'magician-skill': 'arcana',
      },
      asiChoices: {},
      bgChoices: null,
    };
    const derivedSheet = {
      proficiencyBonus: 3,
      abilityScores: { str: 10, dex: 14, con: 12, int: 8, wis: 16, cha: 10 },
      savingThrows: { int: 2, wis: 6 },
      skillBonuses: { Arcana: 6, Perception: 6 },
    };
    const skills = [
      ['Arcana', 'int'],
      ['Perception', 'wis'],
      ['Athletics', 'str'],
    ];

    assert.equal(module.deriveProjectedAbilityScore(character, 'wis'), 16);
    assert.equal(module.deriveProjectedAbilityModifier(character, 'wis'), 3);
    assert.equal(module.deriveProjectedAbilityScore(character, 'wis', { omitAsiRuleId: 'asi-1' }), 16);
    assert.equal(module.deriveProjectedProficiencyBonus(character, derivedSheet), 3);
    assert.equal(module.deriveProjectedSaveBonus(character, 'wis', { derivedSheet }), 6);
    assert.equal(module.deriveProjectedSkillBonus(character, 'Arcana', { derivedSheet, skills, slugify: (value) => String(value).toLowerCase() }), 6);
    assert.equal(module.deriveProjectedSkillBonus(character, 'Athletics', { derivedSheet: null, skills, slugify: (value) => String(value).toLowerCase() }), 0);
  });

  it('keeps app.js consuming typed projection helpers instead of defining local ones', async () => {
    const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

    assert.match(source, /deriveProjectedAbilityScore/);
    assert.match(source, /deriveProjectedAbilityModifier/);
    assert.match(source, /deriveProjectedSaveBonus/);
    assert.match(source, /deriveProjectedSkillBonus/);
    assert.match(source, /deriveProjectedProficiencyBonus/);
    assert.doesNotMatch(source, /function mod\(/);
    assert.doesNotMatch(source, /function abilityScore\(/);
    assert.doesNotMatch(source, /function saveBonus\(/);
    assert.doesNotMatch(source, /function skillBonus\(/);
    assert.doesNotMatch(source, /function proficiency\(/);
    assert.doesNotMatch(source, /function currentAbilityScores\(/);
  });
});
