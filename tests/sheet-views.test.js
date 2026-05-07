import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const summaryView = await import('../dist/src/core/state/summary-view.js');
const skillsView = await import('../dist/src/core/state/skills-view.js');
const attacksView = await import('../dist/src/core/state/attacks-view.js');
const spellsView = await import('../dist/src/core/state/spells-view.js');
const inventoryView = await import('../dist/src/core/state/inventory-view.js');
const featuresView = await import('../dist/src/core/state/features-view.js');

describe('sheet views', () => {
  it('renders summary tab with legacy layout hooks and event attributes', () => {
    const html = summaryView.renderSummarySheet(
      {
        name: 'Nova Ficha',
        class: 'fighter',
        speed: 30,
        savingThrows: ['str', 'con'],
        hitDiceUsed: 0,
        notes: 'Languages: Common, Elvish',
      },
      {
        currentHp: 11,
        maxHp: 11,
        tempHp: 0,
        armorClass: 12,
        initiative: 2,
        proficiencyBonus: 2,
        passivePerception: 10,
        hitDiceTotal: 1,
        hitDie: 10,
        abilityScores: { str: 15, dex: 14, con: 13, int: 13, wis: 12, cha: 8 },
        abilityModifiers: { str: 2, dex: 2, con: 1, int: 1, wis: 1, cha: -1 },
        savingThrows: { str: 4, dex: 2, con: 3, int: 1, wis: 1, cha: -1 },
      }
    );

    assert.match(html, /class="pill-row"/);
    assert.match(html, /class="hero-stats"/);
    assert.match(html, /class="hp-orb"/);
    assert.match(html, /data-open-hp-modal/);
    assert.match(html, /class="small-grid"/);
    assert.match(html, /class="rest-actions"/);
    assert.match(html, /data-rest-type="short"/);
    assert.match(html, /data-rest-type="long"/);
    assert.match(html, /class="abilities"/);
  });

  it('renders skills tab with legacy column layout', () => {
    const html = skillsView.renderSkillsSheet(
      {
        skillProficiencies: ['Athletics'],
      },
      {
        abilityModifiers: { str: 2, dex: 2, con: 1, int: 1, wis: 1, cha: -1 },
        skillBonuses: {
          Athletics: 4,
          Acrobatics: 2,
          Perception: 1,
        },
      }
    );

    assert.match(html, /class="skill-columns"/);
    assert.match(html, /class="skill-card"/);
    assert.match(html, /Athletics/);
  });

  it('renders attacks tab with filter hooks and action table structure', () => {
    const html = attacksView.renderAttacksSheet(
      [
        {
          id: 'rule:attack',
          name: 'Attack',
          subtitle: 'Combat Action',
          icon: 'A',
          range: '--',
          rangeLabel: 'Varies',
          hit: '--',
          damage: [],
          notes: 'Make one attack.',
          kind: 'attack',
        },
      ],
      'all',
      () => 0,
      '',
      {},
      () => 'Short Rest Resource'
    );

    assert.match(html, /class="action-filter-row"/);
    assert.match(html, /data-action-filter="attack"/);
    assert.match(html, /class="actions-heading"/);
    assert.match(html, /class="actions-table"/);
    assert.match(html, /data-action-id="rule:attack"/);
  });

  it('renders spells tab with spell selectors and metrics row', () => {
    const html = spellsView.renderSpellsSheet(
      [],
      [
        { name: 'Sacred Flame', level: 0 },
        { name: 'Healing Word', level: 1 },
      ],
      0,
      3,
      11,
      'Sacred Flame',
      [],
      null,
      { 1: 2 },
      { 1: { max: 2, used: 0 } },
      () => 2,
      (name) => ({
        name,
        level: name === 'Sacred Flame' ? 0 : 1,
        levelLine: name === 'Sacred Flame' ? 'Cantrip' : '1st-level Evocation',
        description: 'Spell description.',
        castingTime: '1 action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Instantaneous',
      }),
      (level) => (level === 0 ? 'Cantrips' : `${level}st Level`),
      (level) => `${level}st`,
      { cleric: 'Cleric' },
      { fighter: 'cleric' },
      'fighter'
    );

    assert.match(html, /class="metric-row"/);
    assert.match(html, /data-spell-name="Sacred Flame"/);
    assert.match(html, /data-cast-spell-level="1"/);
    assert.match(html, /data-close-spell/);
  });

  it('renders inventory tab with head and equip toggles', () => {
    const html = inventoryView.renderInventorySheet(
      [
        { id: 'item-1', name: 'Longsword', kind: 'weapon', quantity: 1, weight: 3, valueGp: 15, typeLabel: 'Weapon' },
      ],
      [],
      { carryingCapacity: 225, encumbered: false },
      ['item-1'],
      () => true,
      () => ['martial', 'versatile']
    );

    assert.match(html, /class="inventory-head"/);
    assert.match(html, /data-toggle-equip="item-1"/);
    assert.match(html, /Longsword/);
  });

  it('renders features tab with legacy filters and section list', () => {
    const html = featuresView.renderFeaturesSheet(
      [
        {
          id: 'second-wind',
          name: 'Second Wind',
          kind: 'class',
          meta: 'Fighter 1 • XPHB',
          description: 'Recover hit points.',
          resource: {
            id: 'secondWind',
            remaining: 1,
            max: 2,
            recoveryLabel: 'Short Rest Resource',
          },
        },
        {
          id: 'skillful',
          name: 'Skillful',
          kind: 'species',
          meta: 'Human • XPHB',
          description: 'Gain a skill.',
        },
      ],
      'all',
      'second-wind'
    );

    assert.match(html, /class="feature-filter-row"/);
    assert.match(html, /data-feature-filter="class"/);
    assert.match(html, /class="feature-section-list"/);
    assert.match(html, /data-feature-id="second-wind"/);
    assert.match(html, /Fighter 1/);
    assert.match(html, /Recover hit points\./);
    assert.match(html, /data-use-resource="secondWind"/);
    assert.match(html, /1\/2 uses/);
  });
});
