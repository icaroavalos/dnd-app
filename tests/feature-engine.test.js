/**
 * Feature Engine Tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
    const source = await import('node:fs').then(fs => fs.promises.readFile(new URL('../app.js', import.meta.url), 'utf8'));

    assert.match(source, /currentFeatureItems\(\s*\)\s*\.map\(\s*\(\s*feature\s*\)\s*=>\s*feature\.resource\s*\)/);
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
                "Once you use this feature, you can't use it again until you finish a Long Rest.",
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

  it('Barbarian level 19 Epic Boon - shows concrete feature text not placeholder', () => {
    const classFeaturesData = JSON.parse(readFileSync('./data/5etools/5e-2024/class-features.json', 'utf-8'));
    const epicBoonFeature = classFeaturesData.results.find(
      f => f.className === 'Barbarian' && f.level === 19 && f.source === 'XPHB'
    );

    assert.ok(epicBoonFeature, 'Barbarian level 19 Epic Boon feature should exist');
    assert.ok(epicBoonFeature.entries, 'Epic Boon should have entries');
    assert.ok(epicBoonFeature.entries.length > 0, 'Epic Boon entries should not be empty');

    const bodyText = Array.isArray(epicBoonFeature.entries) ? epicBoonFeature.entries.join(' ') : epicBoonFeature.entries;
    assert.match(bodyText, /Epic Boon/i, 'Epic Boon should mention Epic Boon');
    assert.match(bodyText, /feat/i, 'Epic Boon should mention feat selection');
    assert.doesNotMatch(bodyText, /^You gain the following benefits\.$/i, 'Should not be just placeholder text');

    console.log(' Barbarian level 19 Epic Boon: OK - Has concrete feature text');
  });

  it('Level up shows new features from chosen level - not just placeholder', () => {
    const barbarian19 = {
      class: 'barbarian',
      level: 19,
      race: 'human',
      classFeatureChoices: {},
      asiChoices: {},
      abilities: { str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
    };

    const api = {
      classes: {
        barbarian: { name: 'Barbarian' },
      },
      races: {
        human: { name: 'Human', source: 'XPHB', traits: [] },
      },
      source: {
        classFeatures: [
          {
            name: 'Epic Boon',
            className: 'Barbarian',
            level: 19,
            source: 'XPHB',
            entries: ['You gain an Epic Boon feat or another feat of your choice. Boon of Irresistible Offense is recommended.'],
          },
        ],
        featDetails: {},
      },
    };

    const items = module.deriveActiveFeatures(barbarian19, api, []);
    const level19Features = items.filter(item => item.name === 'Epic Boon');

    assert.ok(level19Features.length > 0, 'Should have Epic Boon feature at level 19');
    const epicBoon = level19Features[0];
    assert.match(epicBoon.body, /Epic Boon/i, 'Feature body should contain Epic Boon description');
    assert.match(epicBoon.body, /feat/i, 'Feature body should mention feat');
    assert.doesNotMatch(epicBoon.body, /^You gain the following benefits\.$/, 'Should not be just placeholder text');

    console.log(' Level up features: OK - Shows concrete feature text');
  });

  it('features are grouped by origin (class/species/feat) with source metadata', () => {
    const character = {
      class: 'fighter',
      level: 5,
      race: 'human',
      classFeatureChoices: {},
      asiChoices: {},
      abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
    };

    const api = {
      classes: { fighter: { name: 'Fighter' } },
      races: { human: { name: 'Human', source: 'XPHB', traits: [{ name: 'Darkvision', entries: ['You can see in dim light within 60 feet.'] }] } },
      source: {
        classFeatures: [
          { name: 'Second Wind', className: 'Fighter', level: 1, source: 'XPHB', entries: ['Regain hit points as bonus action.'] },
          { name: 'Extra Attack', className: 'Fighter', level: 5, source: 'XPHB', entries: ['Attack twice when you take the Attack action.'] },
        ],
        subclassFeatures: [],
        subclasses: [],
        featDetails: {},
      },
    };

    const items = module.deriveActiveFeatures(character, api, []);

    const classFeatures = items.filter(item => item.kind === 'class');
    assert.ok(classFeatures.length >= 2, 'Should have at least 2 class features');
    classFeatures.forEach(f => {
      assert.match(f.meta, /Fighter/, 'Class feature meta should include class name');
      assert.match(f.meta, /XPHB/, 'Class feature meta should include source');
    });

    const speciesFeatures = items.filter(item => item.kind === 'species');
    assert.ok(speciesFeatures.length >= 1, 'Should have at least 1 species trait');
    speciesFeatures.forEach(f => {
      assert.match(f.meta, /Human/, 'Species feature meta should include race name');
      assert.match(f.meta, /XPHB/, 'Species feature meta should include source');
    });

    console.log(' Feature grouping by origin: OK - class/species/feat with source metadata');
  });

  it('subclass features include subclass name in meta', () => {
    const items = module.deriveActiveFeatures(
      {
        class: 'barbarian',
        level: 6,
        race: 'human',
        classFeatureChoices: { subclass: 'path-of-the-zealot' },
        asiChoices: {},
        abilities: { str: 16, dex: 14, con: 15, int: 8, wis: 10, cha: 12 },
      },
      {
        classes: { barbarian: { name: 'Barbarian' } },
        races: { human: { name: 'Human', source: 'XPHB', traits: [] } },
        source: {
          classFeatures: [
            { name: 'Barbarian Subclass', className: 'Barbarian', level: 3, source: 'XPHB', entries: ['You gain a Barbarian subclass.'] },
            { name: 'Subclass Feature', className: 'Barbarian', level: 6, source: 'XPHB', entries: ['You gain a feature from your Barbarian subclass.'] },
          ],
          subclasses: [
            {
              name: 'Path of the Zealot',
              shortName: 'Zealot',
              source: 'XPHB',
              className: 'Barbarian',
              subclassFeatures: ['Path of the Zealot|Barbarian|XPHB|Zealot|XPHB|3', 'Fanatical Focus|Barbarian|XPHB|Zealot|XPHB|6'],
            },
          ],
          subclassFeatures: [
            { name: 'Path of the Zealot', source: 'XPHB', className: 'Barbarian', classSource: 'XPHB', subclassShortName: 'Zealot', subclassSource: 'XPHB', level: 3, entries: ['Divine fury and fanatic devotion guide your rage.'] },
            { name: 'Fanatical Focus', source: 'XPHB', className: 'Barbarian', classSource: 'XPHB', subclassShortName: 'Zealot', subclassSource: 'XPHB', level: 6, entries: ['Your rage keeps your focus locked on battle.'] },
          ],
          featDetails: {},
        },
      },
      []
    );

    const zealotFeature = items.find(item => item.name === 'Fanatical Focus');
    assert.ok(zealotFeature, 'Should have Fanatical Focus feature');
    assert.match(zealotFeature.meta, /Path of the Zealot/, 'Subclass feature meta should include subclass name');

    console.log(' Subclass feature grouping: OK - includes subclass name in meta');
  });
});
