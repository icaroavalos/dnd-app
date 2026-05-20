import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getSpellAbility } from '../frontend/src/lib/spell-utils.ts';

describe('frontend spell utils', () => {
  it('uses an explicit spellcasting ability from a granted species feature', () => {
    const ability = getSpellAbility(
      {
        name: 'Light',
        originKind: 'feature',
        originName: 'Light Bearer',
        spellcastingAbility: 'cha',
      },
      {
        class: 'Wizard',
        bgChoices: {
          spellcastingAbility: null,
        },
      },
      'int'
    );

    assert.equal(ability, 'cha');
  });

  it('infers spellcasting ability from the saved feature for existing characters', () => {
    const ability = getSpellAbility(
      {
        name: 'Light',
        originKind: 'feature',
        originName: 'Light Bearer',
      },
      {
        class: 'Barbarian',
        bgChoices: {
          spellcastingAbility: 'int',
        },
        features: [
          {
            name: 'Light Bearer',
            description: '**Light Bearer.** You know the [[spell:Light|XPHB]] cantrip. Charisma is your spellcasting ability for it.',
          },
        ],
      },
      'int'
    );

    assert.equal(ability, 'cha');
  });
});
