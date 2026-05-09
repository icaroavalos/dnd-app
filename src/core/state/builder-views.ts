import type { BuilderStepId, Character } from '../../types/state.js';
import type { AbilityName, BackgroundChoiceState } from '../../types/background.js';

type OptionTuple = [string, string];

interface BasicHelpers {
  navButtons: () => string;
  escapeHtml: (value: string | number | null | undefined) => string;
  titleCase: (value: string | number) => string;
}

interface SelectHelpers extends BasicHelpers {
  selectField: (path: string, label: string, value: string, options: OptionTuple[], locked?: boolean) => string;
}

export interface NameFieldArgs {
  character: Pick<Character, 'name'>;
  field: (path: string, label: string, value: string) => string;
}

export interface LineageFormArgs extends SelectHelpers {
  character: Pick<Character, 'class' | 'race' | 'subrace' | 'alignment'>;
  locked: boolean;
  subraceOptions: string[];
  classOptions: OptionTuple[];
  raceOptions: OptionTuple[];
  alignmentOptions: OptionTuple[];
}

export interface AbilitiesFormArgs extends BasicHelpers {
  locked: boolean;
  abilityMethod: string;
  abilityMethods: OptionTuple[];
  className: string;
  classSaves: string[];
  abilityDefinitions: [AbilityName, string][];
  selectField: (path: string, label: string, value: string, options: OptionTuple[], locked?: boolean) => string;
  checkbox: (listName: string, value: string, label: string, checked: boolean, disabled?: boolean, readonly?: boolean) => string;
  renderAbilityMethodControls: () => string;
  renderAbilityScoreCalculations: () => string;
}

export interface ChoicesFormArgs extends BasicHelpers {
  classSkill: { choose: number; options: string[] };
  backgroundSkills: string[];
  selectedClassSkills: string[];
  classChoicesHtml: string;
  equipmentChoicesHtml: string;
  attacksHtml: string;
  locked: boolean;
  checkbox: (listName: string, value: string, label: string, checked: boolean, disabled?: boolean, readonly?: boolean) => string;
}

export interface BackgroundAbilityOption {
  value: string;
  label: string;
  selected: boolean;
  disabled: boolean;
  bonus?: number;
}

export interface BackgroundEquipmentOption {
  value: string;
  label: string;
  hint: string;
  selected: boolean;
}

export interface BackgroundOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface BackgroundViewModelLike {
  currentBackground: string | null;
  options: BackgroundOption[];
  maxAbilityChoices: number;
  selectedAbilityCount: number;
  abilityOptions: BackgroundAbilityOption[];
  skills: string[];
  tools: string[];
  equipmentOptions: BackgroundEquipmentOption[];
  showsMagicInitiate: boolean;
  magicInitiateClass?: string | null;
  spellcastingAbility: string | null;
}

export interface BackgroundFormArgs extends BasicHelpers {
  locked: boolean;
  bgChoices: Pick<BackgroundChoiceState, 'abilityIncrement'>;
  viewModel: BackgroundViewModelLike;
  renderBgSpellChoices: () => string;
}

export interface LevelingFormArgs extends BasicHelpers {
  isLevelUpMode: boolean;
  levelUpBannerHtml: string;
  classChoicesHtml: string;
  spellChoiceRule: {
    cantrips: number;
    spellsMax: number;
    hint: string;
  };
  spellCounts: {
    cantrips: number;
    leveled: number;
  };
  renderSpellChoiceGroups: () => string;
  navButtonsHtml: string;
}

export function renderNameField({ character, field }: NameFieldArgs): string {
  return `
    <section class="character-name-panel">
      ${field('name', 'Nome da ficha', character.name)}
    </section>
  `;
}

export function renderLineageForm(args: LineageFormArgs): string {
  const { character, locked, subraceOptions, classOptions, raceOptions, alignmentOptions, selectField, navButtons, titleCase } = args;
  const hasSubrace = subraceOptions.length > 0;
  const subraceFieldOptions: OptionTuple[] = hasSubrace ? subraceOptions.map((item) => [item, item] as OptionTuple) : [['', '']];

  return `
    <div class="form-grid">
      ${selectField('class', 'Classe', character.class, classOptions, locked)}
      ${selectField('race', 'Raca / especie', character.race, raceOptions, locked)}
      ${hasSubrace ? selectField('subrace', 'Subraca', character.subrace ?? '', subraceFieldOptions, locked) : ''}
      ${selectField('alignment', 'Alinhamento', character.alignment, alignmentOptions, locked)}
    </div>
    <p class="hint">${locked ? 'Origem e classe foram definidos na criacao e ficam travados depois que a ficha e finalizada.' : `Classe, especie, magias e progresso por nivel vem exclusivamente dos dados ${titleCase('5etools 2024')}.`}</p>
    ${navButtons()}
  `;
}

export function renderAbilitiesForm(args: AbilitiesFormArgs): string {
  const { locked, className, classSaves, abilityMethods, abilityMethod, abilityDefinitions, selectField, checkbox, renderAbilityMethodControls, renderAbilityScoreCalculations, navButtons, titleCase } = args;
  return `
    <fieldset class="choice-group ability-method-panel">
      <legend>Ability Scores</legend>
      ${locked ? `<p class="hint">Atributos de criacao ficam travados depois que a ficha e finalizada.</p>` : selectField('abilityMethod', 'Metodo de geracao', abilityMethod ?? 'standard', abilityMethods)}
      ${locked ? '' : renderAbilityMethodControls()}
    </fieldset>
    ${renderAbilityScoreCalculations()}
    <fieldset class="choice-group">
      <legend>Saving throws da classe</legend>
      <p class="choice-counter complete">${classSaves.length}/${classSaves.length} fixos por ${titleCase(className)}</p>
      <p class="hint">Saving throw proficiency vem da classe inicial. Trocar a classe atualiza estes dois saves automaticamente.</p>
      <div class="choice-list">
        ${abilityDefinitions.map(([key, label]) => checkbox('savingThrows', key, label, classSaves.includes(key), !classSaves.includes(key), true)).join('')}
      </div>
    </fieldset>
    ${navButtons()}
  `;
}

export function renderChoicesForm(args: ChoicesFormArgs): string {
  const { classSkill, backgroundSkills, selectedClassSkills, classChoicesHtml, equipmentChoicesHtml, attacksHtml, locked, checkbox, navButtons, escapeHtml } = args;
  const selectedCount = selectedClassSkills.length;
  const skillOptions = [...new Set([...backgroundSkills, ...classSkill.options])];

  return `
    <fieldset class="choice-group">
      <legend>Skills</legend>
      <p class="choice-counter ${selectedCount === classSkill.choose ? 'complete' : selectedCount > classSkill.choose ? 'invalid' : ''}">
        ${selectedCount}/${classSkill.choose} escolhas da classe${backgroundSkills.length ? ` • ${backgroundSkills.length} do background` : ''}
      </p>
      <div class="choice-list">
        ${skillOptions.map((name) => {
          const fromBackground = backgroundSkills.includes(name);
          const isClassOption = classSkill.options.includes(name);
          const isSelected = selectedClassSkills.includes(name);
          return checkbox(
            'classSkillChoices',
            name,
            `${escapeHtml(name)}${fromBackground ? ' <small class="choice-source">Background</small>' : ''}`,
            isSelected || fromBackground,
            locked || !isClassOption || (selectedCount >= classSkill.choose && !isSelected),
            locked || fromBackground
          );
        }).join('')}
      </div>
    </fieldset>
    ${classChoicesHtml}
    ${equipmentChoicesHtml}
    <fieldset class="choice-group">
      <legend>Ataques</legend>
      <div id="attackEditor">
        ${attacksHtml || `<p class="hint">Nenhum ataque cadastrado.</p>`}
      </div>
      <button type="button" class="mini-button" id="addAttackButton">New</button>
      <button type="button" class="mini-button" id="suggestAttacksButton">Sugerir da classe</button>
    </fieldset>
    ${navButtons()}
  `;
}

export function renderBackgroundForm(args: BackgroundFormArgs): string {
  const { locked, bgChoices, viewModel, renderBgSpellChoices, navButtons, titleCase, escapeHtml } = args;
  let bgContent = '<p class="hint">Selecione um background para ver as opcoes.</p>';

  if (viewModel.currentBackground) {
    bgContent = `
      <fieldset class="choice-group">
        <legend>${viewModel.currentBackground}: Ability Scores</legend>
        <p class="hint">Choose how to increase your ability scores. In +2 / +1, the first selected ability receives +2 and the second receives +1.</p>
        <div class="choice-group-inline" style="display:flex;gap:1rem;margin:0.5rem 0;">
          <label><input type="radio" name="ability-increment" value="2_1" ${bgChoices.abilityIncrement === '2_1' ? 'checked' : ''} data-bg-increment /> <span>+2 / +1</span></label>
          <label><input type="radio" name="ability-increment" value="1_1_1" ${bgChoices.abilityIncrement === '1_1_1' ? 'checked' : ''} data-bg-increment /> <span>+1 / +1 / +1</span></label>
        </div>
        <p class="choice-counter ${(viewModel.maxAbilityChoices > 0 && viewModel.selectedAbilityCount === viewModel.maxAbilityChoices) ? 'complete' : ''}">${viewModel.selectedAbilityCount}/${viewModel.maxAbilityChoices || 0} escolhidas</p>
        <div class="choice-list">
          ${viewModel.abilityOptions.map((option) => {
            const bonus = option.bonus ? ` <small class="choice-source">+${option.bonus}</small>` : '';
            return `<label class="${option.selected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}"><input type="checkbox" data-bg-ability="${option.value}" ${option.selected ? 'checked' : ''} ${option.disabled ? 'disabled' : ''} /><span><strong>${option.label}</strong>${bonus}</span></label>`;
          }).join('')}
        </div>
      </fieldset>
      <fieldset class="choice-group">
        <legend>${viewModel.currentBackground}: Skills (automatic)</legend>
        <p class="hint">Skill proficiencies granted by this background:</p>
        <div class="choice-list">${viewModel.skills.map((skill) => `<label class="readonly"><input type="checkbox" checked disabled /><span>${skill}</span></label>`).join('') || '<p class="hint">No skill proficiencies</p>'}</div>
      </fieldset>
      ${viewModel.tools.length > 0 ? `<fieldset class="choice-group"><legend>${viewModel.currentBackground}: Tools (automatic)</legend><div class="choice-list">${viewModel.tools.map((tool) => `<label class="readonly"><input type="checkbox" checked disabled /><span>${tool}</span></label>`).join('')}</div></fieldset>` : ''}
      <fieldset class="choice-group">
        <legend>${viewModel.currentBackground}: Equipment</legend>
        <p class="hint">Choose your starting equipment:</p>
        <div class="choice-list">
          ${viewModel.equipmentOptions.map((option) => `<label><input type="radio" name="bg-equipment" value="${option.value}" ${option.selected ? 'checked' : ''} data-bg-equipment /><span><strong>${option.label}</strong><small>${option.hint}</small></span></label>`).join('')}
        </div>
      </fieldset>
    `;

    if (viewModel.showsMagicInitiate) {
      const magicInitiateClass = viewModel.magicInitiateClass ? titleCase(viewModel.magicInitiateClass) : 'Cleric';
      bgContent += `<fieldset class="choice-group"><legend>Magic Initiate: ${escapeHtml(magicInitiateClass)}</legend><p class="hint">Choose your spellcasting ability for Magic Initiate spells:</p><div class="choice-list">${['int', 'wis', 'cha'].map((ability) => `<label><input type="radio" name="spellcasting-ability" value="${ability}" ${viewModel.spellcastingAbility === ability ? 'checked' : ''} /><span><strong>${titleCase(ability === 'int' ? 'intelligence' : ability === 'wis' ? 'wisdom' : 'charisma')}</strong></span></label>`).join('')}</div></fieldset>`;
      bgContent += renderBgSpellChoices();
    }
  }

  return `
    <section class="background-panel">
      <h2>Background</h2>
      <div class="form-group">
        <label for="bg-select">Escolha seu Background:</label>
        <select id="bg-select" class="select-field" data-bg-select ${locked ? 'disabled' : ''}>
          <option value="">-- Selecione --</option>
          ${viewModel.options.map((opt) =>
            `<option value="${escapeHtml(opt.value)}" ${opt.selected ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
          ).join('')}
        </select>
      </div>
      ${bgContent}
      ${navButtons()}
    </section>
  `;
}

export function renderLevelingForm(args: LevelingFormArgs): string {
  const { isLevelUpMode, levelUpBannerHtml, classChoicesHtml, spellChoiceRule, spellCounts, renderSpellChoiceGroups, navButtonsHtml } = args;
  const spellComplete = spellCounts.cantrips === spellChoiceRule.cantrips && spellCounts.leveled === spellChoiceRule.spellsMax;
  const spellInvalid = spellCounts.cantrips > spellChoiceRule.cantrips || spellCounts.leveled > spellChoiceRule.spellsMax;

  return `
    ${isLevelUpMode ? levelUpBannerHtml : ''}
    ${classChoicesHtml}
    <fieldset class="choice-group">
      <legend>Magias conhecidas / preparadas</legend>
      <p class="choice-counter ${spellComplete ? 'complete' : spellInvalid ? 'invalid' : ''}">
        Cantrips ${spellCounts.cantrips}/${spellChoiceRule.cantrips} | Magias ${spellCounts.leveled}/${spellChoiceRule.spellsMax}
      </p>
      <p class="hint">${spellChoiceRule.hint}</p>
      ${renderSpellChoiceGroups()}
    </fieldset>
    ${navButtonsHtml}
  `;
}
