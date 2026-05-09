import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const module = await import('../dist/src/core/state/spells-view.js');

describe('spells view', () => {
  it('does not auto-select any spell when opening the spells tab', () => {
    const spells = [
      {
        name: 'Fire Bolt',
        level: 0,
        castMode: 'at-will',
      },
      {
        name: 'Magic Missile',
        level: 1,
        castMode: 'slots',
        slotLevel: 1,
      },
    ];

    const html = module.renderSpellsSheet(
      spells,
      1, // casterLevel
      5, // spellAttack
      13, // spellSaveDc
      '', // selectedSpellName - empty means no auto-selection
      { 1: 2 }, // spellSlotsMaxByLevel
      { 1: { max: 2, used: 0 } }, // spellSlotsUsed
      (level) => 2, // availableSpellSlotsAtLevel
      (name) => ({ name, description: 'Test spell' }) // spellFromKnownData
    );

    // Verify that no spell card is rendered when selectedSpell is empty
    assert.doesNotMatch(html, /class="spell-card"/, 'Should not render any spell card when no spell selected');

    // Verify that spells are listed but not selected
    assert.match(html, /Fire Bolt/);
    assert.match(html, /Magic Missile/);
    // The spell button should not have "active" class when none selected
    assert.doesNotMatch(html, /spell-button active/);
  });

  it('renders info button/icon for each spell selection', () => {
    const spells = [
      {
        name: 'Fire Bolt',
        level: 0,
        castMode: 'at-will',
      },
    ];

    const html = module.renderSpellsSheet(
      spells,
      1,
      5,
      13,
      '',
      {},
      {},
      () => 0,
      (name) => ({ name, description: 'Test spell' })
    );

    // Check that there's a row
    assert.match(html, /spell-row/);
    // Verify info button exists with data-spell-info attribute
    assert.match(html, /data-spell-info="Fire Bolt"/);
    // Verify info button has class
    assert.match(html, /class="spell-info-button"/);
    // Verify it contains info icon
    assert.match(html, /info-icon/);
  });

  it('info button does not have data-spell-name (selection attribute)', () => {
    const spells = [
      {
        name: 'Fire Bolt',
        level: 0,
        castMode: 'at-will',
      },
    ];

    const html = module.renderSpellsSheet(
      spells,
      1,
      5,
      13,
      '',
      {},
      {},
      () => 0,
      (name) => ({ name, description: 'Test spell' })
    );

    // Check that the info button element does NOT include data-spell-name attribute.
    // Find the info button substring and ensure it doesn't contain data-spell-name
    const infoButtonMatch = html.match(/<button[^>]*class="spell-info-button"[^>]*>/);
    if (infoButtonMatch) {
      const infoButtonTag = infoButtonMatch[0];
      assert.doesNotMatch(infoButtonTag, /data-spell-name/, 'Info button should not have data-spell-name');
    } else {
      assert.fail('Info button not found');
    }

    // Also ensure that the regular spell button (data-spell-name) is separate
    assert.match(html, /data-spell-name="Fire Bolt"/);
  });

  it('only shows spell card when explicitly selected', () => {
    const spells = [
      {
        name: 'Fire Bolt',
        level: 0,
        castMode: 'at-will',
      },
    ];

    // When a spell is selected, show card
    const htmlSelected = module.renderSpellsSheet(
      spells,
      1,
      5,
      13,
      'Fire Bolt', // selected
      {},
      {},
      () => 0,
      (name) => ({ name, description: 'Test spell', levelLine: 'Cantrip' })
    );

    assert.match(htmlSelected, /class="spell-card"/);
    assert.match(htmlSelected, /Fire Bolt/);

    // When no spell selected, no card
    const htmlNotSelected = module.renderSpellsSheet(
      spells,
      1,
      5,
      13,
      '',
      {},
      {},
      () => 0,
      (name) => ({ name, description: 'Test spell' })
    );

    assert.doesNotMatch(htmlNotSelected, /class="spell-card"/);
  });
});
