import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const module = await import('../dist/src/core/character/feature-engine.js');

describe('feature engine', () => {
  it('derives feature descriptions and resource rules from active class features', () => {
    const items = module.deriveActiveFeatures(
      {
        class: 'fighter',
        level: 1,
        race: 'human',
        classFeatureChoices: {},
        asiChoices: {},
        abilities: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 },
      },
      {
        classes: {
          fighter: { name: 'Fighter', classTableGroups: [] },
        },
        races: {
          human: { name: 'Human', source: 'XPHB', traits: [] },
        },
        source: {
          classFeatures: [
            {
              name: 'Second Wind',
              className: 'Fighter',
              level: 1,
              source: 'XPHB',
              entries: [
                'As a Bonus Action, you can regain hit points. You can use this feature twice. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.',
              ],
            },
          ],
          featDetails: {},
        },
      },
      []
    );

    assert.equal(items.length, 1);
    assert.equal(items[0].name, 'Second Wind');
    assert.match(items[0].body, /regain hit points/i);
    assert.equal(items[0].resource?.id, 'secondWind');
    assert.equal(items[0].resource?.max, 2);
    assert.equal(items[0].resource?.actionKind, 'bonus');
    assert.equal(items[0].resource?.recovery.short, 1);
    assert.equal(items[0].resource?.recovery.long, 'all');
  });

  it('keeps app.js using feature-engine resources instead of duplicating resource parsing', async () => {
    const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

    assert.match(source, /currentFeatureItems\(\)\s*\.map\(\(feature\) => feature\.resource\)/);
    assert.doesNotMatch(source, /function currentClassResourceDefinitions\(/);
    assert.doesNotMatch(source, /function resourceDefinitionFromFeature\(/);
    assert.doesNotMatch(source, /const RESOURCE_META = \[/);
  });

  it('replaces barbarian subclass placeholders with the chosen subclass features at later levels', () => {
    const items = module.deriveActiveFeatures(
      {
        class: 'barbarian',
        level: 10,
        race: 'human',
        classFeatureChoices: {
          subclass: 'path-of-the-zealot',
        },
        asiChoices: {},
        abilities: { str: 16, dex: 14, con: 15, int: 8, wis: 10, cha: 12 },
      },
      {
        classes: {
          barbarian: { name: 'Barbarian', classTableGroups: [] },
        },
        races: {
          human: { name: 'Human', source: 'XPHB', traits: [] },
        },
        source: {
          classFeatures: [
            {
              name: 'Barbarian Subclass',
              className: 'Barbarian',
              level: 3,
              source: 'XPHB',
              entries: ['You gain a Barbarian subclass.'],
            },
            {
              name: 'Subclass Feature',
              className: 'Barbarian',
              level: 6,
              source: 'XPHB',
              entries: ['You gain a feature from your Barbarian subclass.'],
            },
            {
              name: 'Subclass Feature',
              className: 'Barbarian',
              level: 10,
              source: 'XPHB',
              entries: ['You gain a feature from your Barbarian subclass.'],
            },
          ],
          subclasses: [
            {
              name: 'Path of the Zealot',
              shortName: 'Zealot',
              source: 'XPHB',
              className: 'Barbarian',
              subclassFeatures: [
                'Path of the Zealot|Barbarian|XPHB|Zealot|XPHB|3',
                'Fanatical Focus|Barbarian|XPHB|Zealot|XPHB|6',
                'Zealous Presence|Barbarian|XPHB|Zealot|XPHB|10',
                'Rage of the Gods|Barbarian|XPHB|Zealot|XPHB|14',
              ],
            },
          ],
          subclassFeatures: [
            {
              name: 'Path of the Zealot',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassShortName: 'Zealot',
              subclassSource: 'XPHB',
              level: 3,
              entries: ['Divine fury and fanatic devotion guide your rage.'],
            },
            {
              name: 'Fanatical Focus',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassShortName: 'Zealot',
              subclassSource: 'XPHB',
              level: 6,
              entries: ['Your rage keeps your focus locked on battle.'],
            },
            {
              name: 'Zealous Presence',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassShortName: 'Zealot',
              subclassSource: 'XPHB',
              level: 10,
              entries: ['You can unleash divine zeal to inspire allies. Once you use this feature, you cannot use it again until you finish a Long Rest.'],
            },
          ],
          featDetails: {},
        },
      },
      []
    );

    const classFeatures = items.filter((item) => item.kind === 'class');

    assert.equal(classFeatures.some((item) => item.name === 'Subclass Feature'), false);
    assert.equal(classFeatures.some((item) => item.name === 'Fanatical Focus'), true);
    assert.equal(classFeatures.some((item) => item.name === 'Zealous Presence'), true);

    const zeal = classFeatures.find((item) => item.name === 'Zealous Presence');
    assert.match(zeal?.body ?? '', /unleash divine zeal/i);
    assert.equal(zeal?.resource?.max, 1);
    assert.equal(zeal?.resource?.recovery.long, 'all');
    assert.match(zeal?.meta ?? '', /Path of the Zealot/);
  });

  it('prefers the XPHB subclass record and resolves berserker subclass features from local 5etools subclass data', () => {
    const items = module.deriveActiveFeatures(
      {
        class: 'barbarian',
        level: 14,
        race: 'human',
        classFeatureChoices: {
          subclass: 'path-of-the-berserker',
        },
        asiChoices: {},
        abilities: { str: 18, dex: 14, con: 16, int: 8, wis: 10, cha: 12 },
      },
      {
        classes: {
          barbarian: { name: 'Barbarian', classTableGroups: [] },
        },
        races: {
          human: { name: 'Human', source: 'XPHB', traits: [] },
        },
        source: {
          classFeatures: [
            {
              name: 'Barbarian Subclass',
              className: 'Barbarian',
              level: 3,
              source: 'XPHB',
              entries: ['You gain a Barbarian subclass.'],
            },
            {
              name: 'Subclass Feature',
              className: 'Barbarian',
              level: 6,
              source: 'XPHB',
              entries: ['You gain a feature from your Barbarian subclass.'],
            },
            {
              name: 'Subclass Feature',
              className: 'Barbarian',
              level: 10,
              source: 'XPHB',
              entries: ['You gain a feature from your Barbarian subclass.'],
            },
            {
              name: 'Subclass Feature',
              className: 'Barbarian',
              level: 14,
              source: 'XPHB',
              entries: ['You gain a feature from your Barbarian subclass.'],
            },
          ],
          subclasses: [
            {
              name: 'Path of the Berserker',
              shortName: 'Berserker',
              source: 'PHB',
              className: 'Barbarian',
              classSource: 'XPHB',
            },
            {
              name: 'Path of the Berserker',
              shortName: 'Berserker',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassFeatures: [
                'Path of the Berserker|Barbarian|XPHB|Berserker|XPHB|3',
                'Mindless Rage|Barbarian|XPHB|Berserker|XPHB|6',
                'Retaliation|Barbarian|XPHB|Berserker|XPHB|10',
                'Intimidating Presence|Barbarian|XPHB|Berserker|XPHB|14',
              ],
            },
          ],
          subclassFeatures: [
            {
              name: 'Path of the Berserker',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassShortName: 'Berserker',
              subclassSource: 'XPHB',
              level: 3,
              entries: [
                'Channel Rage into Violent Fury.',
                {
                  type: 'refSubclassFeature',
                  subclassFeature: 'Frenzy|Barbarian|XPHB|Berserker|XPHB|3',
                },
              ],
            },
            {
              name: 'Frenzy',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassShortName: 'Berserker',
              subclassSource: 'XPHB',
              level: 3,
              entries: ['You deal extra damage while using Reckless Attack during your Rage.'],
            },
            {
              name: 'Mindless Rage',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassShortName: 'Berserker',
              subclassSource: 'XPHB',
              level: 6,
              entries: ['You have Immunity to the Charmed and Frightened conditions while your Rage is active.'],
            },
            {
              name: 'Retaliation',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassShortName: 'Berserker',
              subclassSource: 'XPHB',
              level: 10,
              entries: ['When you take damage from a nearby creature, you can take a Reaction to make one melee attack against that creature.'],
            },
            {
              name: 'Intimidating Presence',
              source: 'XPHB',
              className: 'Barbarian',
              classSource: 'XPHB',
              subclassShortName: 'Berserker',
              subclassSource: 'XPHB',
              level: 14,
              entries: [
                'As a Bonus Action, you can strike terror into others.',
                'Once you use this feature, you can\'t use it again until you finish a Long Rest.',
              ],
            },
          ],
          featDetails: {},
        },
      },
      []
    );

    const classFeatures = items.filter((item) => item.kind === 'class');
    assert.equal(classFeatures.some((item) => item.name === 'Barbarian Subclass'), false);
    assert.equal(classFeatures.some((item) => item.name === 'Subclass Feature'), false);
    assert.equal(classFeatures.some((item) => item.name === 'Frenzy'), true);
    assert.equal(classFeatures.some((item) => item.name === 'Mindless Rage'), true);
    assert.equal(classFeatures.some((item) => item.name === 'Retaliation'), true);
    assert.equal(classFeatures.some((item) => item.name === 'Intimidating Presence'), true);

    const frenzy = classFeatures.find((item) => item.name === 'Frenzy');
    const mindlessRage = classFeatures.find((item) => item.name === 'Mindless Rage');
    const intimidatingPresence = classFeatures.find((item) => item.name === 'Intimidating Presence');

    assert.match(frenzy?.body ?? '', /extra damage/i);
    assert.match(mindlessRage?.body ?? '', /immunity/i);
    assert.equal(intimidatingPresence?.resource?.max, 1);
    assert.equal(intimidatingPresence?.resource?.actionKind, 'bonus');
    assert.equal(intimidatingPresence?.resource?.recovery.long, 'all');
    assert.match(intimidatingPresence?.meta ?? '', /Path of the Berserker/);
  });
});
