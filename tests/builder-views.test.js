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

it('renders leveling form with class choices and spell selection', () => {
const state = {
character: { class: 'wizard', level: 1, spellSlots: {}, bgSpellChoices: {} },
api: {
classes: { wizard: { name: 'Wizard', hitDie: 'd6' } },
source: {
classFeatures: [
{ name: 'Spellcasting', className: 'Wizard', level: 1, source: 'XPHB', entries: ['You can cast spells.'] },
{ name: 'Arcane Recovery', className: 'Wizard', level: 1, source: 'XPHB', entries: ['Recover spell slots on short rest.'] },
],
},
},
};

const renderSpellChoiceGroups = () => '<div>spell choices</div>';
const navButtonsHtml = '<nav>level-up nav</nav>';

const html = module.renderLevelingForm({
isLevelUpMode: false,
levelUpBannerHtml: '',
classChoicesHtml: '<div>ASI choice</div>',
spellChoiceRule: { cantrips: 3, spellsMax: 6, hint: 'Choose cantrips and spells' },
spellCounts: { cantrips: 0, leveled: 0 },
renderSpellChoiceGroups,
navButtonsHtml,
});

assert.match(html, /Magias conhecidas/);
assert.match(html, /spell choices/);
});

it('leveling form shows validation state for spell choices', () => {
const html = module.renderLevelingForm({
isLevelUpMode: false,
levelUpBannerHtml: '',
classChoicesHtml: '',
spellChoiceRule: { cantrips: 2, spellsMax: 4, hint: 'Select spells' },
spellCounts: { cantrips: 2, leveled: 4 }, // complete
renderSpellChoiceGroups: () => '<div>spells</div>',
navButtonsHtml: '',
});

assert.match(html, /complete/);
assert.doesNotMatch(html, /invalid/);
});

it('leveling form shows invalid state when too many spells selected', () => {
const html = module.renderLevelingForm({
isLevelUpMode: false,
levelUpBannerHtml: '',
classChoicesHtml: '',
spellChoiceRule: { cantrips: 2, spellsMax: 4, hint: 'Select spells' },
spellCounts: { cantrips: 3, leveled: 4 }, // too many cantrips
renderSpellChoiceGroups: () => '<div>spells</div>',
navButtonsHtml: '',
});

assert.match(html, /invalid/);
});
});
