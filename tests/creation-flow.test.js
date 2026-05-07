import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const creationFlowModule = await import('../dist/src/core/state/creation-flow.js');

describe('creation flow', () => {
  it('keeps the builder step order in the typed flow module', () => {
    assert.deepEqual(creationFlowModule.CREATION_STEPS, [
      ['lineage', 'Origem'],
      ['background', 'Background'],
      ['abilities', 'Atributos'],
      ['choices', 'Escolhas'],
      ['leveling', 'Niveis'],
    ]);
  });

  it('reports missing lineage, background, and point-buy requirements', () => {
    const baseState = {
      character: {
        name: '',
        class: '',
        race: '',
        subrace: '',
        background: '',
        abilityMethod: 'pointBuy',
        abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
        classSkillChoices: [],
        classFeatureChoices: {},
        equipmentChoices: {},
      },
      levelUpMode: false,
      creationChoicesLocked: false,
      pointBuyBudget: 27,
      pointBuySpent: 25,
      subraceRequired: true,
      backgroundStepMissing: [],
      classSkillSelectedCount: 0,
      classSkillRequiredCount: 2,
      activeChoiceRules: [],
      backgroundSpellSelections: [],
      equipmentChoiceNames: [],
      missingLevelUpChoices: [],
      spellChoiceStatus: null,
    };

    assert.deepEqual(creationFlowModule.getMissingChoicesForStep('lineage', baseState), [
      'nome da ficha',
      'classe',
      'raca/especie',
      'subraca/linhagem',
    ]);
    assert.deepEqual(creationFlowModule.getMissingChoicesForStep('background', baseState), ['background']);
    assert.deepEqual(creationFlowModule.getMissingChoicesForStep('abilities', baseState), ['2 pontos de Point Buy']);
  });

  it('reports missing creation choices including magic initiate and equipment', () => {
    const validationState = {
      character: {
        name: 'Kael',
        class: 'cleric',
        race: 'human',
        subrace: 'Human',
        background: 'Acolyte',
        abilityMethod: 'standard',
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        classSkillChoices: ['Insight'],
        classFeatureChoices: { domain: 'life' },
        equipmentChoices: {},
        creationComplete: false,
      },
      levelUpMode: false,
      creationChoicesLocked: false,
      pointBuyBudget: 27,
      pointBuySpent: 27,
      subraceRequired: false,
      backgroundStepMissing: [],
      classSkillSelectedCount: 1,
      classSkillRequiredCount: 2,
      activeChoiceRules: [
        { name: 'Divine Order', type: 'feature', complete: true },
        { name: 'Ability Score Improvement', type: 'asi', complete: false },
      ],
      backgroundSpellSelections: [],
      equipmentChoiceNames: ['Cleric Equipment'],
      missingLevelUpChoices: [],
      spellChoiceStatus: null,
    };

    assert.deepEqual(creationFlowModule.getMissingCreationChoices(validationState), [
      '2 skill(s) da classe',
      'Ability Score Improvement',
      'Cleric Equipment',
    ]);
  });

  it('reports incomplete magic initiate choices on the background step', () => {
    const backgroundState = {
      character: {
        name: 'Kael',
        class: 'cleric',
        race: 'human',
        subrace: 'Human',
        background: 'Acolyte',
        abilityMethod: 'standard',
        abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        classSkillChoices: [],
        classFeatureChoices: {},
        equipmentChoices: {},
        creationComplete: false,
      },
      levelUpMode: false,
      creationChoicesLocked: false,
      pointBuyBudget: 27,
      pointBuySpent: 27,
      subraceRequired: false,
      backgroundStepMissing: [
        '2 atributos do background',
        'Acolyte Equipment',
        'Magic Initiate: habilidade de conjuracao',
        'Magic Initiate (Cleric): 2 cantrips',
        'Magic Initiate (Cleric): 1 level 1 spell',
      ],
      classSkillSelectedCount: 0,
      classSkillRequiredCount: 2,
      activeChoiceRules: [],
      backgroundSpellSelections: [],
      equipmentChoiceNames: [],
      missingLevelUpChoices: [],
      spellChoiceStatus: null,
    };

    assert.deepEqual(creationFlowModule.getMissingChoicesForStep('background', backgroundState), [
      '2 atributos do background',
      'Acolyte Equipment',
      'Magic Initiate: habilidade de conjuracao',
      'Magic Initiate (Cleric): 2 cantrips',
      'Magic Initiate (Cleric): 1 level 1 spell',
    ]);
  });

  it('keeps background step validation aligned with bgChoices fallback in app.js', () => {
    const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
    assert.match(
      source,
      /background:\s*state\.character\.background\s*\|\|\s*state\.character\.bgChoices\?\.background\s*\|\|\s*""/
    );
    assert.match(
      source,
      /if \(state\.step === "background" && !state\.character\.background && state\.character\.bgChoices\?\.background\) \{\s*state\.character\.background = state\.character\.bgChoices\.background;\s*\}/
    );
  });
});
