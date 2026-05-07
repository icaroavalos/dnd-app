import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const magicInitiateModule = await import('../dist/src/lib/magic-initiate-validator.js');

function loadBackgroundDetails() {
  const data = JSON.parse(readFileSync(new URL('../data/5etools/5e-2024/backgrounds.json', import.meta.url), 'utf8'));
  return Object.fromEntries(data.results.map((background) => [background.name.toLowerCase(), background]));
}

function loadClassSpells() {
  const classSpellsData = JSON.parse(readFileSync(new URL('../data/5etools/5e-2024/class-spells.json', import.meta.url), 'utf8'));
  const spellsData = JSON.parse(readFileSync(new URL('../data/5etools/5e-2024/spells.json', import.meta.url), 'utf8'));
  const spellByKey = new Map(
    spellsData.results.map((spell) => [`${spell.name.toLowerCase()}|${spell.source.toLowerCase()}`, spell])
  );

  return Object.fromEntries(
    Object.values(classSpellsData.results).map((list) => [
      String(list.className).toLowerCase(),
      (list.spells ?? [])
        .map((reference) => spellByKey.get(`${reference.name.toLowerCase()}|${reference.source.toLowerCase()}`))
        .filter(Boolean)
        .map((spell) => ({ name: spell.name, level: spell.level, source: spell.source })),
    ])
  );
}

describe('magic initiate validator', () => {
  it('builds Magic Initiate rules and cleric spell options from 5etools data', () => {
    assert.equal(typeof magicInitiateModule.getBackgroundSpellOptions, 'function');
    assert.equal(typeof magicInitiateModule.getSelectedBackgroundSpellNames, 'function');
    assert.equal(typeof magicInitiateModule.resolveBackgroundSpellcastingAbility, 'function');
    assert.equal(typeof magicInitiateModule.getSpellcastingMetrics, 'function');

    const backgroundDetails = loadBackgroundDetails();
    const classSpells = loadClassSpells();
    const granted = magicInitiateModule.getBackgroundGrantedSpells('Acolyte', backgroundDetails);
    const rules = magicInitiateModule.createBackgroundSpellRules(granted);
    const options = magicInitiateModule.getBackgroundSpellOptions('cleric', classSpells);

    assert.equal(rules.length, 1);
    assert.deepEqual(rules[0], {
      id: 'bg-magic-initiate-cleric-0',
      name: 'Magic Initiate (Cleric)',
      type: 'bg_spell_choice',
      spellList: 'cleric',
      cantrips: 2,
      level1Spells: 1,
    });

    assert(options.some((spell) => spell.name === 'Guidance' && spell.level === 0));
    assert(options.some((spell) => spell.name === 'Bless' && spell.level === 1));
  });

  it('derives selected background spell names and spellcasting metrics from the chosen ability', () => {
    const rules = [{
      id: 'bg-magic-initiate-cleric-0',
      name: 'Magic Initiate (Cleric)',
      type: 'bg_spell_choice',
      spellList: 'cleric',
      cantrips: 2,
      level1Spells: 1,
    }];

    const selectedSpellNames = magicInitiateModule.getSelectedBackgroundSpellNames({
      'bg-bg-magic-initiate-cleric-0': ['Guidance', 'Sacred Flame', 'Bless'],
    }, rules);

    assert.deepEqual(selectedSpellNames, ['Guidance', 'Sacred Flame', 'Bless']);
    assert.equal(
      magicInitiateModule.resolveBackgroundSpellcastingAbility(
        { spellcastingAbility: 'cha' },
        rules
      ),
      'cha'
    );
    assert.deepEqual(
      magicInitiateModule.getSpellcastingMetrics('cha', { str: 10, dex: 10, con: 10, int: 12, wis: 14, cha: 16 }, 2),
      {
        ability: 'cha',
        modifier: 3,
        attackBonus: 5,
        saveDc: 13,
      }
    );
  });
});
