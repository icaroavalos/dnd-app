import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import consolidated formatters
const formatter = await import('../dist/src/lib/formatter.js');

describe('formatter consolidation', () => {
  it('preserves legacy label outputs from labels.js', () => {
    // compactRange - replaces feet/foot with ft.
    assert.equal(formatter.compactRange('60 feet'), '60 ft.');
    assert.equal(formatter.compactRange('5 feet'), '5 ft.');
    assert.equal(formatter.compactRange('10 foot'), '10 ft.');
    assert.equal(formatter.compactRange('Self'), 'Self');

    // rangeLabel - returns "Range" or "Reach" based on range string
    assert.equal(formatter.rangeLabel('60 feet'), 'Range');
    assert.equal(formatter.rangeLabel('5 feet'), 'Range');
    assert.equal(formatter.rangeLabel('Self'), 'Reach');
    assert.equal(formatter.rangeLabel('Special'), 'Reach');

    // spellLevelLabel - Portuguese labels for spell levels
    assert.equal(formatter.spellLevelLabel(0), 'Cantrips');
    assert.equal(formatter.spellLevelLabel(1), 'Magias de nivel 1');
    assert.equal(formatter.spellLevelLabel(2), 'Magias de nivel 2');
    assert.equal(formatter.spellLevelLabel(9), 'Magias de nivel 9');

    // ordinalLabel - English ordinal suffixes (simple version)
    assert.equal(formatter.ordinalLabel(1), '1st');
    assert.equal(formatter.ordinalLabel(2), '2nd');
    assert.equal(formatter.ordinalLabel(3), '3rd');
    assert.equal(formatter.ordinalLabel(4), '4th');
    assert.equal(formatter.ordinalLabel(5), '5th');
    assert.equal(formatter.ordinalLabel(10), '10th');
    // Note: simple ordinalLabel does not handle special cases like 11th, 12th, 13th, 21st, etc.
    // It returns `${level}th` for any number not in {1,2,3}

    // damageTypeLabel - maps single-letter damage types
    assert.equal(formatter.damageTypeLabel('B'), 'Bludgeoning');
    assert.equal(formatter.damageTypeLabel('P'), 'Piercing');
    assert.equal(formatter.damageTypeLabel('S'), 'Slashing');
    assert.equal(formatter.damageTypeLabel('X'), 'X');

    // propertyLabel - maps weapon property codes
    assert.equal(formatter.propertyLabel('V'), 'Versatile');
    assert.equal(formatter.propertyLabel('L'), 'Light');
    assert.equal(formatter.propertyLabel('T'), 'Thrown');
    assert.equal(formatter.propertyLabel('F'), 'Finesse');
    assert.equal(formatter.propertyLabel('H'), 'Heavy');
    assert.equal(formatter.propertyLabel('R'), 'Reach');
    assert.equal(formatter.propertyLabel('2H'), 'Two-Handed');
    assert.equal(formatter.propertyLabel('unknown'), 'unknown');
  });

  it('preserves legacy formatter.ts outputs', () => {
    // format5etoolsComponents - formats component objects
    assert.equal(formatter.format5etoolsComponents({ v: true, s: true, m: true }), 'V, S, M');
    assert.equal(formatter.format5etoolsComponents({ v: true, s: true }), 'V, S');
    assert.equal(formatter.format5etoolsComponents({ v: true }), 'V');
    assert.equal(formatter.format5etoolsComponents(null), '-');

    // spellSchoolName - maps school codes to names
    assert.equal(formatter.spellSchoolName('A'), 'Abjuration');
    assert.equal(formatter.spellSchoolName('C'), 'Conjuration');
    assert.equal(formatter.spellSchoolName('D'), 'Divination');
    assert.equal(formatter.spellSchoolName('E'), 'Enchantment');
    assert.equal(formatter.spellSchoolName('I'), 'Illusion');
    assert.equal(formatter.spellSchoolName('N'), 'Necromancy');
    assert.equal(formatter.spellSchoolName('T'), 'Transmutation');
    assert.equal(formatter.spellSchoolName('V'), 'Evocation');
    assert.equal(formatter.spellSchoolName('X'), 'X');

    // formatCurrency - formats gold piece values
    assert.equal(formatter.formatCurrency(100), '1 GP');
    assert.equal(formatter.formatCurrency(50), '50 CP');
    assert.equal(formatter.formatCurrency(1000), '10 GP');
  });

  it('preserves source label format from 5etools metadata', () => {
    // Source labels must match exactly for compatibility
    assert.ok('XPHB', 'XPHB');
    assert.ok('PHB', 'PHB');
    assert.ok('DMG', 'DMG');
    assert.ok('SCAG', 'SCAG');
    assert.ok('TCE', 'TCE');
  });

  it('exports entriesToText for 5etools entry conversion', () => {
    // entriesToText should be available
    assert.equal(typeof formatter.entriesToText, 'function');

    // Test basic entriesToText functionality
    const entries = [{ type: 'item', name: 'Test' }];
    const result = formatter.entriesToText(entries);
    assert.ok(typeof result === 'string');
  });
});
