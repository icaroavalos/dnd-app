import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const module = await import('../dist/src/core/state/builder-views.js');

describe('builder views', () => {
  it('exports typed renderers for the builder steps', () => {
    assert.equal(typeof module.renderNameField, 'function');
    assert.equal(typeof module.renderLineageForm, 'function');
    assert.equal(typeof module.renderAbilitiesForm, 'function');
    assert.equal(typeof module.renderChoicesForm, 'function');
    assert.equal(typeof module.renderBackgroundForm, 'function');
    assert.equal(typeof module.renderLevelingForm, 'function');
  });

  it('renders key builder sections from pure typed modules', () => {
    const field = (path, label, value) => `<label data-path="${path}">${label}:${value}</label>`;
    const selectField = (path, label) => `<select data-path="${path}">${label}</select>`;
    const checkbox = (path, value, label) => `<label data-check="${path}:${value}">${label}</label>`;
    const navButtons = () => '<nav>nav</nav>';

    const lineage = module.renderLineageForm({
      character: { class: 'fighter', race: 'human', subrace: '', alignment: 'Neutral' },
      locked: false,
      subraceOptions: [],
      classOptions: [['fighter', 'Fighter']],
      raceOptions: [['human', 'Human']],
      alignmentOptions: [['Neutral', 'Neutral']],
      selectField,
      navButtons,
      titleCase: (value) => value,
    });
    const abilities = module.renderAbilitiesForm({
      locked: false,
      className: 'fighter',
      classSaves: ['str', 'con'],
      abilityMethods: [['standard', 'Standard']],
      abilityMethod: 'standard',
      abilityDefinitions: [['str', 'Strength'], ['dex', 'Dexterity']],
      selectField,
      checkbox,
      navButtons,
      titleCase: (value) => String(value),
      escapeHtml: (value) => String(value),
      renderAbilityMethodControls: () => '<div>method-controls</div>',
      renderAbilityScoreCalculations: () => '<div>score-cards</div>',
    });
    const background = module.renderBackgroundForm({
      locked: false,
      viewModel: {
        currentBackground: 'Acolyte',
        options: [{ value: 'Acolyte', label: 'Acolyte', selected: true }],
        maxAbilityChoices: 2,
        selectedAbilityCount: 1,
        abilityOptions: [{ value: 'wis', label: 'Wisdom', selected: true, disabled: false, bonus: 2 }],
        skills: ['Insight'],
        tools: [],
        equipmentOptions: [{ value: 'A', label: 'Book', hint: 'Book + robes', selected: true }],
        showsMagicInitiate: true,
        spellcastingAbility: 'wis',
      },
      bgChoices: { abilityIncrement: '2_1' },
      navButtons,
      titleCase: (value) => value,
      escapeHtml: (value) => String(value),
      renderBgSpellChoices: () => '<fieldset>spell choices</fieldset>',
    });

    assert.match(lineage, /Classe/);
    assert.match(lineage, /Alinhamento/);
    assert.match(abilities, /Saving throws da classe/);
    assert.match(abilities, /score-cards/);
    assert.match(background, /Magic Initiate: Cleric/);
    assert.match(background, /spell choices/);
  });

  it('keeps app.js consuming typed builder views instead of defining local builder renderers', async () => {
    const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');

    assert.match(source, /from "\.\/dist\/src\/core\/state\/builder-views\.js"/);
    assert.match(source, /renderTypedNameField/);
    assert.match(source, /renderTypedLineageForm/);
    assert.match(source, /renderTypedAbilitiesForm/);
    assert.match(source, /renderTypedChoicesForm/);
    assert.match(source, /renderTypedBackgroundForm/);
    assert.match(source, /renderTypedLevelingForm/);
  });
});
