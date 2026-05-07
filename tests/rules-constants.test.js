import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const module = await import('../dist/src/core/rules/constants.js');

describe('rules constants', () => {
  it('exports the static rules data used by the app shell', () => {
    assert.deepEqual(module.ABILITIES, [
      ['str', 'Strength'],
      ['dex', 'Dexterity'],
      ['con', 'Constitution'],
      ['int', 'Intelligence'],
      ['wis', 'Wisdom'],
      ['cha', 'Charisma'],
    ]);
    assert.equal(module.DATA_SOURCE, 'data/5etools/5e-2024');
    assert.equal(module.DATA_SOURCE_LABEL, '5etools 2024');
    assert.deepEqual(module.CLASSES.slice(0, 4), ['barbarian', 'bard', 'cleric', 'druid']);
    assert.deepEqual(module.BACKGROUNDS, ['Acolyte', 'Criminal', 'Folk Hero', 'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier']);
    assert.equal(module.CLASS_HIT_DIE.fighter, 10);
    assert.equal(module.CLASS_SKILLS.bard.choose, 3);
    assert.equal(module.CLASS_SKILLS.bard.options.includes('Arcana'), true);
    assert.equal(module.CLASS_DECKS.wizard, 'arcane');
    assert.equal(module.HALF_CASTER.has('paladin'), true);
    assert.equal(module.STARTER_ATTACKS.rogue[0].name, 'Rapier');
    assert.deepEqual(module.TABS.map(([id]) => id), ['summary', 'skills', 'attacks', 'spells', 'inventory', 'features']);
  });

  it('keeps app.js consuming the typed constants module instead of redefining them locally', async () => {
    const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

    assert.match(source, /from "\.\/dist\/src\/core\/rules\/constants\.js"/);
    assert.doesNotMatch(source, /const ABILITIES = \[/);
    assert.doesNotMatch(source, /const SKILLS = \[/);
    assert.doesNotMatch(source, /const CLASSES = \[/);
    assert.doesNotMatch(source, /const RACES = \[/);
    assert.doesNotMatch(source, /const SUBRACES = \{/);
    assert.doesNotMatch(source, /const BACKGROUNDS = \[/);
    assert.doesNotMatch(source, /const CLASS_HIT_DIE = \{/);
    assert.doesNotMatch(source, /const CLASS_SKILLS = \{/);
    assert.doesNotMatch(source, /const RACE_TRAITS = \{/);
    assert.doesNotMatch(source, /const STARTER_ATTACKS = \{/);
    assert.doesNotMatch(source, /const HALF_CASTER = new Set/);
    assert.doesNotMatch(source, /const CLASS_DECKS = \{/);
    assert.doesNotMatch(source, /const TABS = \[/);
  });
});
