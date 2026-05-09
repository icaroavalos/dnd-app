import {
  deriveCharacterSheet,
  deriveProjectedAbilityModifier,
  deriveProjectedAbilityScore,
  deriveProjectedAbilityScores,
  deriveProjectedProficiencyBonus,
  deriveProjectedSaveBonus,
  deriveProjectedSkillBonus,
} from "./dist/src/core/character/character-projection.js";
import { deriveAvailableActions } from "./dist/src/core/engine/action-engine.js";
import { deriveActiveModifiers, modifierTotal } from "./dist/src/core/engine/modifier-engine.js";
import { RuleRepository } from "./dist/src/core/rules/rule-repository.js";
import { applyBackgroundStepSelection, updateCreationField } from "./dist/src/core/state/creation-form-controller.js";
import { calculateCharacterAbilityBonuses } from "./dist/src/core/character/ability-bonuses.js";
import {
  calculateFixedHpGain,
  calculateMaxHpGain,
  deriveAbilityScores,
  deriveLevelOneMaxHp,
  deriveProficiencyBonus,
  deriveSpellcastingMetrics,
  signed,
} from "./dist/src/core/character/character-engine.js";
import {
  autoGrantedSpellEntries as typedAutoGrantedSpellEntries,
  backgroundSpellResourceDefinitions as typedBackgroundSpellResourceDefinitions,
  casterLevel as typedCasterLevel,
  classSpellAbility as typedClassSpellAbility,
  currentKnownSpellNames as typedCurrentKnownSpellNames,
  currentSpellEntries as typedCurrentSpellEntries,
  spellAbility as typedSpellAbility,
  spellAbilityForSpell as typedSpellAbilityForSpell,
  resolveSelectedSpellName as typedResolveSelectedSpellName,
  spellcastingMetricsForAbility as typedSpellcastingMetricsForAbility,
  spellFromKnownData as typedSpellFromKnownData,
  spellSlotsMaxByLevel as typedSpellSlotsMaxByLevel,
  classHasSpellList as typedClassHasSpellList,
} from "./dist/src/core/character/spell-engine.js";
import {
  buildSpellClassIndex,
  normalize5etoolsSpell as typedNormalize5etoolsSpell,
  resolveSpellDetail as typedResolveSpellDetail,
} from "./dist/src/core/character/spell-detail.js";
import {
  itemDetail as typedItemDetail,
  itemKey as typedItemKey,
  itemTypeLabel as typedItemTypeLabel,
  normalizeInventoryItem as typedNormalizeInventoryItem,
  parseItemRef as typedParseItemRef,
} from "./dist/src/core/character/inventory-engine.js";
import {
  resourceRecoveryFromBody as typedResourceRecoveryFromBody,
  resourceActionKindFromBody as typedResourceActionKindFromBody,
  resourceRecoveryLabel,
} from "./dist/src/core/character/resource-engine.js";
import { deriveActiveFeatures } from "./dist/src/core/character/feature-engine.js";
import { loadState as typedLoadState, saveState as typedSaveState, fetchJson } from "./dist/src/core/state/persistence.js";
import { renderSummarySheet } from "./dist/src/core/state/summary-view.js";
import { renderSkillsSheet } from "./dist/src/core/state/skills-view.js";
import { renderAttacksSheet } from "./dist/src/core/state/attacks-view.js";
import { renderInventorySheet } from "./dist/src/core/state/inventory-view.js";
import { renderFeaturesSheet } from "./dist/src/core/state/features-view.js";
import { renderSpellsSheet } from "./dist/src/core/state/spells-view.js";
import {
  renderNameField as renderTypedNameField,
  renderLineageForm as renderTypedLineageForm,
  renderAbilitiesForm as renderTypedAbilitiesForm,
  renderChoicesForm as renderTypedChoicesForm,
  renderBackgroundForm as renderTypedBackgroundForm,
  renderLevelingForm as renderTypedLevelingForm,
} from "./dist/src/core/state/builder-views.js";
import { titleCase, slugifyName, escapeHtml, setByPath, clamp, clean5etoolsText } from "./dist/src/lib/utils.js";
import { entriesToText } from "./dist/src/lib/formatter.js";
import { CREATION_STEPS, validateCreationStep } from "./dist/src/core/state/creation-flow.js";
import {
  applyGuidedBackgroundEquipmentChoice,
  applyGuidedBackgroundIncrement,
  applyGuidedBackgroundSpellcastingAbility,
  buildGuidedBackgroundViewModel,
  ensureGuidedBackgroundChoiceState,
  toggleGuidedBackgroundAbility,
} from "./dist/src/core/state/guided-background-builder.js";
import {
  createBackgroundSpellRules as createMagicInitiateSpellRules,
  getBackgroundGrantedSpells as getMagicInitiateBackgroundGrants,
  getBackgroundSpellOptions as getMagicInitiateSpellOptions,
} from "./dist/src/lib/magic-initiate-validator.js";
import {
  buildScoreCards,
  buildPointBuyViewModel,
  buildStandardArrayCards,
  swapAbilities,
  adjustPointBuyScore as typedAdjustPointBuyScore,
  applyAbilityMethod as typedApplyAbilityMethod,
  pointBuySpent as typedPointBuySpent,
  getClassSavingThrows as typedGetClassSavingThrows,
  ABILITY_METHODS,
  STANDARD_ARRAY,
  POINT_BUY_BUDGET,
} from "./dist/src/core/state/abilities-step.js";
import {
  ABILITIES,
  ALIGNMENT_OPTIONS,
  CLASSES,
  CLASS_HIT_DIE,
  DATA_SOURCE,
  DATA_SOURCE_LABEL,
  HALF_CASTER,
  RACES,
  SKILLS,
  STARTER_ATTACKS,
  TABS,
} from "./dist/src/core/rules/constants.js";
import { createFormControls } from "./src/app/form-controls.js";
import { compactRange, damageTypeLabel, ordinalLabel, propertyLabel, rangeLabel, spellLevelLabel } from "./src/app/labels.js";
import { createInventoryHelpers } from "./src/app/inventory-helpers.js";
import { build5etoolsApi, walkEntries } from "./src/app/5etools-source.js";
import { createSheetRenderers } from "./src/app/sheet-renderers.js";
import { createSpellHelpers } from "./src/app/spell-helpers.js";
import { createResourceHelpers } from "./src/app/resource-helpers.js";
import { createModalRenderers } from "./src/app/modal-renderers.js";
import { createCharacterMenu } from "./src/app/character-menu.js";
import { createCharacterRoster } from "./src/app/character-roster.js";
import { createApiData } from "./src/app/api-data.js";
import { createAppShell } from "./src/app/app-shell.js";
import { createGlobalEvents } from "./src/app/global-events.js";

const STEPS = CREATION_STEPS;

const defaultState = {
  step: "lineage",
  tab: "summary",
  dataStatus: "local",
  derived: null,
  selectedSpell: "",
  actionFilter: "all",
  selectedAction: "",
  featureFilter: "all",
  selectedFeature: "",
  hpModalOpen: false,
  hpModalMode: "damage",
  hpModalAmount: 0,
  hpModalTempAmount: "",
  bgSpellChoices: {},
 restModalOpen: false,
 restModalType: null,
 restModalContent: null,
  validationMessage: "",
  builderVisible: true,
  levelUpMode: false,
  levelUpFrom: 1,
  levelUpHpBase: 0,
  levelUpHpGain: 0,
  levelUpSnapshot: null,
  levelUpClassMode: "same",
  deleteConfirmId: null,
  api: { classes: {}, levels: {}, races: {}, spells: [], classSpells: {}, spellDetails: {}, source: {} },
  activeCharacterId: "default",
  characters: [],
  character: {
    name: "Cascarudo",
    class: "monk",
    level: 1,
    race: "Turtle",
    subrace: "Turtle",
    alignment: "Neutral",
    experience: 0,
    abilityMethod: "standard",
    classFeatureChoices: {},
    asiChoices: {},
    equipmentChoices: {},
    bgChoices: null,
    inventory: [],
    equippedItems: [],
    hitDiceUsed: 0,
    spellSlots: {},
    resources: {},
    tempHp: 0,
    creationComplete: false,
    hp: 95,
    armorClass: 17,
    speed: 45,
    abilities: { str: 12, dex: 16, con: 10, int: 14, wis: 16, cha: 8 },
    savingThrows: ["str", "dex"],
    classSkillChoices: ["Athletics", "Stealth"],
    skillProficiencies: ["Athletics", "Stealth", "Medicine", "Survival", "Religion"],
    attacks: [
      { name: "Shortsword", range: "5 feet", type: "Piercing", damage: "1d6" },
      { name: "Dart", range: "30/120", type: "Piercing", damage: "1d6" },
      { name: "Unarmed Strike", range: "10 feet", type: "Bludgeoning", damage: "1d8" },
      { name: "Espada Longa", range: "5 feet", type: "Slashing", damage: "1d12" },
    ],
    spells: ["Elementalism", "Fireball"],
    notes: "Turtle Features:\n- You can draw as an unarmed attack for 1d4 slashing damage.\n- You can hold your breath for 60 minutes.\n- You cannot wear armor and your base AC is 17.\n\nHermit Feature:\n- Your seclusion granted you a unique revelation.\n\nMonk Features:\n- Add Wisdom to AC when not wearing armor or using a shield.\n- Unarmed strikes improve with level.\n- Ki points restore during rest.",
  },
};

let state = loadState();
let ruleRepository = new RuleRepository();
const { field, numberField, selectField, checkbox } = createFormControls({ escapeHtml });
const {
  equipmentChoiceRules,
  rebuildInventoryFromChoices,
  normalizeInventoryItem,
  parseItemRef,
  itemDetail,
  itemKey,
  itemTypeLabel,
  itemTags,
} = createInventoryHelpers({
  getState: () => state,
  titleCase,
  entriesToText,
  damageTypeLabel,
  propertyLabel,
  itemDetail: typedItemDetail,
  itemKey: typedItemKey,
  itemTypeLabel: typedItemTypeLabel,
  normalizeInventoryItem: typedNormalizeInventoryItem,
  parseItemRef: typedParseItemRef,
});
const {
  renderSpellChoiceGroups,
  legalSpellOptions,
  legalSpellNames,
  selectedSpellCounts,
  spellSlotsMaxByLevel,
  syncSpellSlots,
  availableSpellSlotsAtLevel,
  castSpell,
  resetSpellSlots,
} = createSpellHelpers({
  getState: () => state,
  checkbox,
  titleCase,
  spellLevelLabel,
  spellSlotsMaxByLevel: typedSpellSlotsMaxByLevel,
  clamp,
  maxSpellLevelAvailable,
  spellFromKnownData,
  autoGrantedCantripNames,
  autoGrantedSpellNameSet,
});
const {
  syncResources,
  useResource,
  useAction,
  recoverShortRestResources: recoverShortRestResourcesImpl,
  applyRest,
  confirmRest,
  availableHitDice,
  cancelRest,
} = createResourceHelpers({
  getState: () => state,
  currentResourceDefinitions,
  clamp,
  currentActionItems,
  castSpell,
  maxHitPoints,
  resetSpellSlots,
  persist,
  render,
  renderSheet,
  renderRestModal,
  deriveProjectedAbilityModifier,
});
const sheetRenderers = createSheetRenderers({
  getState: () => state,
  renderSummarySheet,
  renderSkillsSheet,
  renderAttacksSheet,
  renderInventorySheet,
  renderFeaturesSheet,
  renderSpellsSheet,
  deriveActiveModifiers,
  currentActionItems,
  availableSpellSlotsAtLevel,
  resourceRecoveryLabel,
  isEquipableItem,
  itemTags,
  currentFeatureItems,
  spellcastingMetricsForAbility: typedSpellcastingMetricsForAbility,
  spellAbility: typedSpellAbility,
  currentSheetSpellEntries,
  resolveSpellDetail: typedResolveSpellDetail,
  spellFromKnownData,
  casterLevel: typedCasterLevel,
  spellSlotsMaxByLevel,
});

const els = {
  app: document.querySelector("#app"),
  form: document.querySelector("#builderForm"),
  stepNav: document.querySelector("#stepNav"),
  sheetTabs: document.querySelector("#sheetTabs"),
  sheetView: document.querySelector("#sheetView"),
  saveButton: document.querySelector("#saveButton"),
  characterMenuButton: document.querySelector("#characterMenuButton"),
  characterMenu: document.querySelector("#characterMenu"),
  menuBackdrop: document.querySelector("#menuBackdrop"),
  hpModalBackdrop: document.querySelector("#hpModalBackdrop"),
  hpModal: document.querySelector("#hpModal"),
  topbarName: document.querySelector("#topbarName"),
  syncState: document.querySelector("#syncState"),
};
const modalRenderers = createModalRenderers({
  getState: () => state,
  els,
  document,
  closeHpModal,
  applyHpModalAction,
  deriveProjectedAbilityModifier,
  availableHitDice,
  cancelRest,
  confirmRest,
});
const characterRoster = createCharacterRoster({
  getState: () => state,
  defaultCharacter: defaultState.character,
  abilityDefinitions: ABILITIES,
  standardArray: STANDARD_ARRAY,
  clone: structuredClone,
  randomUUID: () => crypto.randomUUID(),
  defaultSubrace,
  maxLevelOneHp,
  defaultSaves,
  normalizeCharacterState,
  resolveSelectedSpellName: typedResolveSelectedSpellName,
  knownSheetSpellNames,
  persist,
  render,
  renderCharacterMenu,
});
const characterMenu = createCharacterMenu({
  getState: () => state,
  els,
  escapeHtml,
  titleCase,
  createNewCharacter,
  closeCharacterMenu,
  startLevelUpAssistant,
  persist,
  render,
  requestDeleteCharacter,
  switchCharacter,
  deleteCharacter,
  cancelDeleteCharacter,
});
const apiData = createApiData({
  getState: () => state,
  dataSource: DATA_SOURCE,
  dataSourceLabel: DATA_SOURCE_LABEL,
  fetchJson,
  build5etoolsApi,
  buildSpellClassIndex,
  normalize5etoolsSpell: typedNormalize5etoolsSpell,
  RuleRepository,
  setRuleRepository: (repository) => { ruleRepository = repository; },
  slugifyName,
  entriesToText,
  itemKey,
  deriveProficiencyBonus,
  normalizeCharacterState,
  persist,
  renderChrome,
});
const appShell = createAppShell({
  getState: () => state,
  els,
  steps: STEPS,
  tabs: TABS,
  persist,
  validateStepRange,
  bindFormEvents,
  renderNameField,
  renderLineageForm,
  renderAbilitiesForm,
  renderChoicesForm,
  renderBackgroundForm,
  renderLevelingForm,
  renderCharacterMenu,
  renderSheet,
  renderHpModal,
  renderRestModal,
});
const globalEvents = createGlobalEvents({
  getState: () => state,
  els,
  document,
  persist,
  renderChrome,
  toggleCharacterMenu,
  closeCharacterMenu,
  closeHpModal,
  cancelRest,
});

init();

async function init() {
  state.api.spellDetails ??= {};
  state.api.classSpells ??= {};
  Object.entries(state.api.classSpells).forEach(([className, spells]) => {
    if (Array.isArray(spells) && (spells.length === 0 || spells.some((spell) => typeof spell === "string"))) delete state.api.classSpells[className];
  });
  state.api.spellDetails = Object.fromEntries(
    Object.entries(state.api.spellDetails).filter(([name, detail]) => String(detail?.name).toLowerCase() === name.toLowerCase())
  );
  if (state.step === "identity") state.step = "lineage";
  ensureRosterState();
  normalizeCharacterState();
  state.selectedSpell = typedResolveSelectedSpellName(state.selectedSpell, knownSheetSpellNames());
  bindGlobalEvents();
  render();
  await hydrateApiData();
  render();
}

function loadState() {
  return typedLoadState(defaultState);
}

function persist() {
  syncActiveCharacter();
  typedSaveState(state);
}

function ensureRosterState() {
  return characterRoster.ensureRosterState();
}

function syncActiveCharacter() {
  return characterRoster.syncActiveCharacter();
}

function bindGlobalEvents() {
  return globalEvents.bindGlobalEvents();
}

function createStartingCharacter() {
  return characterRoster.createStartingCharacter();
}

function createNewCharacter() {
  return characterRoster.createNewCharacter();
}

function switchCharacter(characterId) {
  return characterRoster.switchCharacter(characterId);
}

function deleteCharacter(characterId) {
  return characterRoster.deleteCharacter(characterId);
}

function requestDeleteCharacter(characterId) {
  return characterRoster.requestDeleteCharacter(characterId);
}

function cancelDeleteCharacter() {
  return characterRoster.cancelDeleteCharacter();
}

async function hydrateApiData() {
  return apiData.hydrateApiData();
}

async function loadClassData(className) {
  return apiData.loadClassData(className);
}

async function loadRaceData(raceName) {
  return apiData.loadRaceData(raceName);
}

async function loadClassSpellOptions(className) {
  return apiData.loadClassSpellOptions(className);
}

async function loadSpellDetails(spellName) {
  return apiData.loadSpellDetails(spellName);
}

function render() {
  return appShell.render();
}

function renderChrome() {
  return appShell.renderChrome();
}

function renderCharacterMenu() {
  return characterMenu.renderCharacterMenu();
}

function bindCharacterMenuEvents() {
  return characterMenu.bindCharacterMenuEvents();
}

function toggleCharacterMenu() {
  return characterMenu.toggleCharacterMenu();
}

function closeCharacterMenu() {
  return characterMenu.closeCharacterMenu();
}

function renderSteps() {
  return appShell.renderSteps();
}

function renderTabs() {
  return appShell.renderTabs();
}

function renderForm() {
  return appShell.renderForm();
}

function renderNameField() {
  return renderTypedNameField({
    character: state.character,
    field,
  });
}

function renderLineageForm() {
  const c = state.character;
  const locked = creationChoicesLocked();
  const subraceOptions = subracesFor(c.race);
  const classOptions = state.api.source?.classOptions?.length ? state.api.source.classOptions : CLASSES.map((item) => [item, titleCase(item)]);
  const raceOptions = state.api.source?.raceOptions?.length ? state.api.source.raceOptions : RACES.map((item) => [item, titleCase(item)]);
  return renderTypedLineageForm({
    character: c,
    locked,
    subraceOptions,
    classOptions,
    raceOptions,
    alignmentOptions: ALIGNMENT_OPTIONS,
    selectField,
    navButtons,
    titleCase,
    escapeHtml,
  });
}

function renderAbilitiesForm() {
  const locked = creationChoicesLocked();
  const classSaves = typedGetClassSavingThrows(state.character.class, state.api.classes);
  return renderTypedAbilitiesForm({
    locked,
    abilityMethod: state.character.abilityMethod ?? "standard",
    abilityMethods: ABILITY_METHODS,
    className: state.character.class,
    classSaves,
    abilityDefinitions: ABILITIES,
    selectField,
    checkbox,
    navButtons,
    titleCase,
    escapeHtml,
    renderAbilityMethodControls,
    renderAbilityScoreCalculations,
  });
}

function renderAbilityMethodControls() {
  const method = state.character.abilityMethod ?? "standard";
  if (method === "standard") return renderStandardArrayControls();
  if (method === "pointBuy") return renderPointBuyControls();
  return `
    <div class="ability-grid">
      ${ABILITIES.map(([key, label]) => numberField(`abilities.${key}`, label, state.character.abilities[key], 1, 30)).join("")}
    </div>
    <p class="hint">Use Manual/Rolled para digitar valores rolados na mesa ou qualquer distribuicao definida pelo mestre.</p>
  `;
}

function renderStandardArrayControls() {
  const cards = buildStandardArrayCards(state.character);
  return `
    <div class="standard-array-grid">
      ${cards.map((card) => `
        <button type="button" class="standard-array-card" draggable="true" data-standard-ability="${card.key}">
          <span>${card.label}</span>
          <strong>${card.score}</strong>
          <em>${card.modifierFormatted}</em>
        </button>
      `).join('')}
    </div>
    <p class="hint">Arraste um atributo sobre outro para trocar os valores entre eles.</p>
  `;
}

function renderPointBuyControls() {
  const bonuses = calculateCharacterAbilityBonuses(state.character);
  const vm = buildPointBuyViewModel(state.character.abilities, bonuses);
  return `
    <div class="point-buy-head">
      <strong>${vm.remaining} pontos restantes</strong>
      <span>${vm.spent}/${vm.budget} gastos</span>
    </div>
    <div class="point-buy-grid">
      ${vm.rows.map((row) => `
        <article class="point-buy-row">
          <div>
            <strong>${row.label}</strong>
            <span>Custo ${row.cost} | Mod ${row.modifierFormatted}</span>
          </div>
          <div class="score-stepper">
            <button type="button" class="mini-button" data-ability-adjust="${row.key}" data-delta="-1" ${row.canDecrease ? "" : "disabled"}>-</button>
            <output>${row.score}</output>
            <button type="button" class="mini-button" data-ability-adjust="${row.key}" data-delta="1" ${row.canIncrease ? "" : "disabled"}>+</button>
          </div>
        </article>
      `).join('')}
    </div>
    <p class="hint">Point Buy usa valores de 8 a 15 antes dos bonus de especie. Aumentar de 13 para 14 ou 15 custa mais.</p>
  `;
}

function renderAbilityScoreCalculations() {
  const cards = buildScoreCards(state.character);
  return `
    <section class="score-calculations">
      <h3>Score Calculations</h3>
      <div class="score-card-grid">
        ${cards.map((card) => `
          <article class="score-calc-card">
            <h4>${card.label}</h4>
            <div><span>Total Score</span><strong>${card.totalScore}</strong></div>
            <div><span>Modifier</span><strong>${card.modifierFormatted}</strong></div>
            <div><span>Base Score</span><strong>${card.baseScore}</strong></div>
            <div><span>Bonus</span><strong>${card.bonusFormatted}</strong></div>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderChoicesForm() {
  const classSkill = classSkillRule();
  const backgroundSkills = backgroundSkillProficiencies();
  const selected = state.character.classSkillChoices ?? [];
  const classChoices = classCreationChoiceRules();
  const creationEquipmentRules = equipmentChoiceRules().filter((rule) => rule.id !== "background-starting-equipment");
  const locked = creationChoicesLocked();
  return renderTypedChoicesForm({
    classSkill,
    backgroundSkills,
    selectedClassSkills: selected,
    classChoicesHtml: classChoices.map(renderClassCreationChoice).join(""),
    equipmentChoicesHtml: creationEquipmentRules.map(renderEquipmentChoice).join(""),
    attacksHtml: state.character.attacks.map((attack, index) => attackEditorRow(attack, index)).join(""),
    locked,
    checkbox,
    navButtons,
    escapeHtml,
    titleCase,
  });
}

function renderEquipmentChoice(rule) {
  const selected = state.character.equipmentChoices?.[rule.id] ?? "";
  const locked = creationChoicesLocked();
  return `
    <fieldset class="choice-group">
      <legend>${escapeHtml(rule.name)}</legend>
      <p class="choice-counter ${selected ? "complete" : ""}">${selected ? "1" : "0"}/1 escolhida</p>
      <p class="hint">${escapeHtml(rule.summary)}</p>
      <div class="choice-list">
        ${rule.options.map((option) => `
          <label>
            <input type="radio" name="equipment-${rule.id}" data-equipment-choice="${rule.id}" value="${escapeHtml(option.value)}" ${selected === option.value ? "checked" : ""} ${locked ? "disabled" : ""} />
            <span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.hint)}</small></span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function renderClassCreationChoice(rule) {
  if (rule.type === "asi") return renderAsiChoice(rule);
  const selected = state.character.classFeatureChoices?.[rule.id] ?? "";
  return `
    <fieldset class="choice-group">
      <legend>${escapeHtml(rule.name)}</legend>
      <p class="choice-counter ${selected ? "complete" : ""}">${selected ? "1" : "0"}/${rule.count} escolhida</p>
      <p class="hint">${escapeHtml(rule.summary)}</p>
      <div class="choice-list">
        ${rule.options.map((option) => `
          <label>
            <input type="radio" name="class-feature-${rule.id}" data-class-feature-choice="${rule.id}" value="${escapeHtml(option.value)}" ${selected === option.value ? "checked" : ""} ${choiceLocked(rule) ? "disabled" : ""} />
            <span><strong>${escapeHtml(option.label)}</strong>${option.hint ? `<small>${escapeHtml(option.hint)}</small>` : ""}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function renderAsiChoice(rule) {
  const rawChoice = state.character.asiChoices?.[rule.id];
  const choice = normalizedAsiChoice(rule);
  const featOptions = qualifiedFeatOptions(rule.featCategory);
  return `
    <fieldset class="choice-group">
      <legend>${escapeHtml(rule.name)}</legend>
      <p class="choice-counter ${isAsiChoiceComplete(rule) ? "complete" : ""}">${isAsiChoiceComplete(rule) ? "1" : "0"}/1 escolhida</p>
      <p class="hint">${escapeHtml(rule.summary)}</p>
      <div class="choice-list">
        <label>
          <input type="radio" name="asi-mode-${rule.id}" data-asi-mode="${rule.id}" value="asi" ${rawChoice?.mode === "asi" ? "checked" : ""} ${choiceLocked(rule) ? "disabled" : ""} />
          <span><strong>Ability Score Improvement</strong><small>+2 em um atributo, ou +1 em dois atributos, maximo 20.</small></span>
        </label>
        <label>
          <input type="radio" name="asi-mode-${rule.id}" data-asi-mode="${rule.id}" value="feat" ${rawChoice?.mode === "feat" ? "checked" : ""} ${choiceLocked(rule) ? "disabled" : ""} />
          <span><strong>Escolher feat</strong><small>Mostra feats para as quais o personagem qualifica.</small></span>
        </label>
      </div>
      ${rawChoice?.mode === "feat" ? `
        ${selectField(`asiChoices.${rule.id}.feat`, "Feat", choice.feat, [["", "Escolha um feat"], ...featOptions], choiceLocked(rule))}
      ` : rawChoice?.mode === "asi" ? `
        ${selectField(`asiChoices.${rule.id}.pattern`, "Bonus", choice.pattern, [["plus2", "+2 em um atributo"], ["plus1plus1", "+1 em dois atributos"]], choiceLocked(rule))}
        <div class="form-grid">
          ${selectField(`asiChoices.${rule.id}.ability1`, "Atributo 1", choice.ability1, asiAbilityOptions(), choiceLocked(rule))}
          ${choice.pattern === "plus1plus1" ? selectField(`asiChoices.${rule.id}.ability2`, "Atributo 2", choice.ability2, asiAbilityOptions(choice.ability1), choiceLocked(rule)) : ""}
        </div>
      ` : ""}
    </fieldset>
  `;
}

function renderBackgroundForm() {
  const bgChoices = ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background, state.api.source);
  const currentBg = bgChoices.background || state.character.background;
  const locked = creationChoicesLocked();
  const viewModel = buildGuidedBackgroundViewModel({
    ...bgChoices,
    background: currentBg || bgChoices.background || null,
  }, state.api.source);
  return renderTypedBackgroundForm({
    locked,
    bgChoices,
    viewModel,
    navButtons,
    titleCase,
    escapeHtml,
    renderBgSpellChoices: () => backgroundSpellChoiceRules().map(renderBgSpellChoice).join(""),
  });
}

function renderLevelingForm() {
  const spellRule = spellChoiceRule();
  const spellCounts = selectedSpellCounts();
  const classChoices = levelScopedChoiceRules();
  const levelUpBannerHtml = state.levelUpMode ? `
    <section class="level-up-banner">
      <strong>Level up: ${state.levelUpFrom} → ${state.character.level}</strong>
      <span>Este fluxo mostra apenas o que pode mudar neste nivel.</span>
    </section>
    ${renderLevelUpClassChoice()}
    ${renderLevelUpHpControl()}
  ` : "";
  return renderTypedLevelingForm({
    isLevelUpMode: state.levelUpMode,
    levelUpBannerHtml,
    classChoicesHtml: classChoices.length ? classChoices.map(renderClassCreationChoice).join("") : "",
    spellChoiceRule: spellRule,
    spellCounts,
    renderSpellChoiceGroups: () => renderSpellChoiceGroups(spellRule, spellCounts),
    navButtonsHtml: state.levelUpMode ? levelUpNavButtons() : navButtons(),
    navButtons,
    titleCase,
    escapeHtml,
  });
}

function renderLevelUpClassChoice() {
  return `
    <fieldset class="choice-group">
      <legend>Classe deste nivel</legend>
      <p class="choice-counter complete">1/1 escolhida</p>
      <div class="choice-list">
        <label>
          <input type="radio" name="level-up-class-mode" data-level-up-class-mode value="same" checked />
          <span><strong>${titleCase(state.character.class)}</strong><small>Nivel ${state.character.level}</small></span>
        </label>
        <label class="disabled">
          <input type="radio" name="level-up-class-mode" value="multiclass" disabled />
          <span><strong>Multiclasse</strong><small>Vai exigir suporte de niveis por classe antes de aplicar regras corretamente.</small></span>
        </label>
      </div>
    </fieldset>
  `;
}

function renderLevelUpHpControl() {
  const con = deriveProjectedAbilityModifier(state.character, "con");
  const die = (state.api.classes[state.character.class]?.hit_die ?? 8);
  const fixed = fixedHpGain();
  const min = Math.max(1, 1 + con);
  const max = Math.max(1, die + con);
  return `
    <fieldset class="choice-group hp-level-group">
      <legend>Hit Points deste nivel</legend>
      <p class="hint">D&D 2024: ao subir de nivel, escolha rolar 1d${die} ou usar o valor fixo ${fixed - con}; depois some seu modificador de Constitution (${signed(con)}). O ganho minimo e 1.</p>
      <div class="hp-gain-row">
        <button type="button" class="mini-button" data-hp-preset="${fixed}">Fixo ${fixed}</button>
        <button type="button" class="mini-button" data-hp-preset="${max}">Max ${max}</button>
        <label>
          Ganho de HP
          <input type="number" min="${min}" max="${max}" value="${state.levelUpHpGain || fixed}" data-level-hp-gain />
        </label>
      </div>
      <p class="choice-counter complete">HP: ${state.levelUpHpBase || state.character.hp - (state.levelUpHpGain || 0)} + ${state.levelUpHpGain || fixed} = ${state.character.hp}</p>
    </fieldset>
  `;
}

function navButtons() {
  const index = STEPS.findIndex(([id]) => id === state.step);
  const isLast = index === STEPS.length - 1;
  return `
    ${state.validationMessage ? `<p class="validation-message">${escapeHtml(state.validationMessage)}</p>` : ""}
    <div class="nav-row">
      <button type="button" class="secondary-button" data-move="${Math.max(0, index - 1)}">Voltar</button>
      <button type="button" class="primary-button" data-move="${Math.min(STEPS.length - 1, index + 1)}" ${isLast ? "data-finish-builder" : ""}>${isLast ? "Finalizar" : "Continuar"}</button>
    </div>
  `;
}

function levelUpNavButtons() {
  return `
    ${state.validationMessage ? `<p class="validation-message">${escapeHtml(state.validationMessage)}</p>` : ""}
    <div class="nav-row">
      <button type="button" class="secondary-button" data-cancel-level-up>Cancelar</button>
      <button type="button" class="primary-button" data-apply-level-up>Aplicar</button>
    </div>
  `;
}

function validateStepRange(fromIndex, toIndex) {
  for (let index = fromIndex; index < toIndex; index += 1) {
    if (!validateStep(STEPS[index][0])) return false;
  }
  return true;
}

function validateStep(step) {
  const result = validateCreationStep(step, buildCreationFlowState());
  state.validationMessage = result.message;
  return result.valid;
}

function missingLevelUpChoices() {
  if (!state.levelUpMode) return [];
  return state.levelUpHpGain ? [] : ["ganho de HP do nivel"];
}

function buildCreationFlowState() {
  const classSkill = classSkillRule();
  const bgSpellRules = backgroundSpellChoiceRules();
  const currentBackground = state.character.background || state.character.bgChoices?.background || "";
  const activeRules = activeChoiceRulesForValidation().map((rule) => ({
    name: rule.name,
    type: rule.type,
    complete: rule.type === "asi" ? isAsiChoiceComplete(rule) : Boolean(state.character.classFeatureChoices?.[rule.id]),
  }));
  const backgroundSpellSelections = bgSpellRules.map((rule) => {
    const storageKey = `bg-${rule.id}`;
    const selected = state.character.bgSpellChoices?.[storageKey] || [];
    return {
      name: rule.name,
      selectedCantrips: selected.filter((spellName) => state.api.source?.spellDetails?.[spellName.toLowerCase()]?.level === 0).length,
      requiredCantrips: rule.cantrips || 2,
      selectedLevel1: selected.filter((spellName) => state.api.source?.spellDetails?.[spellName.toLowerCase()]?.level === 1).length,
      requiredLevel1Spells: rule.level1Spells || 1,
    };
  });
  const spellRule = spellChoiceRule();
  const spellCounts = selectedSpellCounts();
  const backgroundStepMissing = [];
  const backgroundAbilityCount = state.character.bgChoices?.abilityScores?.length ?? 0;
  const backgroundAbilityRequired = state.character.bgChoices?.abilityIncrement === "2_1"
    ? 2
    : state.character.bgChoices?.abilityIncrement === "1_1_1"
      ? 3
      : 0;

  if (currentBackground) {
    if (!state.character.bgChoices || !state.character.bgChoices.abilityIncrement) {
      backgroundStepMissing.push("distribuicao de atributos do background");
    } else if (backgroundAbilityRequired > 0 && backgroundAbilityCount < backgroundAbilityRequired) {
      backgroundStepMissing.push(`${backgroundAbilityRequired} atributos do background`);
    }

    if (!state.character.bgChoices?.equipmentChoice) {
      backgroundStepMissing.push(`${currentBackground} Equipment`);
    }

    const isGuided = Boolean(state.api.source?.backgroundDetails?.[currentBackground.toLowerCase()]);
    const showsMagicInitiate = isGuided && getBackgroundGrantedSpells().length > 0;
    if (showsMagicInitiate && !state.character.bgChoices?.spellcastingAbility) {
      backgroundStepMissing.push("Magic Initiate: habilidade de conjuracao");
    }

    if (isGuided) {
      backgroundSpellSelections.forEach((selection) => {
        if (selection.selectedCantrips < selection.requiredCantrips) {
          backgroundStepMissing.push(`Magic Initiate: ${selection.requiredCantrips - selection.selectedCantrips} cantrips`);
        }
        if (selection.selectedLevel1 < selection.requiredLevel1Spells) {
          backgroundStepMissing.push(`Magic Initiate: ${selection.requiredLevel1Spells - selection.selectedLevel1} magias de nivel 1`);
        }
      });
    }
  }

  return {
    character: {
      ...state.character,
      background: state.character.background || state.character.bgChoices?.background || "",
      creationComplete: state.creationComplete,
    },
    levelUpMode: state.levelUpMode,
    creationChoicesLocked: creationChoicesLocked(),
    pointBuyBudget: POINT_BUY_BUDGET,
    pointBuySpent: pointBuySpent(),
    subraceRequired: subracesFor(state.character.race).length > 0,
    backgroundStepMissing,
    classSkillSelectedCount: (state.character.classSkillChoices ?? []).length,
    classSkillRequiredCount: classSkill.choose,
    activeChoiceRules: activeRules,
    backgroundSpellSelections,
    equipmentChoiceNames: !state.levelUpMode && !state.creationComplete
      ? equipmentChoiceRules()
          .filter((rule) => rule.id !== "background-starting-equipment")
          .filter((rule) => !state.character.equipmentChoices?.[rule.id])
          .map((rule) => rule.name)
      : [],
    missingLevelUpChoices: missingLevelUpChoices(),
    spellChoiceStatus: spellRule.totalMax === 0
      ? null
      : {
          selectedCantrips: spellCounts.cantrips,
          requiredCantrips: spellRule.cantrips,
          selectedLeveled: spellCounts.leveled,
          requiredLeveled: spellRule.spellsMax,
        },
  };
}

function attackEditorRow(attack, index) {
  return `
    <div class="form-grid" data-attack="${index}">
      ${field(`attacks.${index}.name`, "Nome", attack.name)}
      ${field(`attacks.${index}.range`, "Alcance", attack.range)}
      ${field(`attacks.${index}.damage`, "Dano", attack.damage)}
      ${field(`attacks.${index}.type`, "Tipo", attack.type)}
      <button type="button" class="mini-button" data-remove-attack="${index}">Remover</button>
    </div>
  `;
}

function bindFormEvents() {
  els.form.querySelectorAll("[data-path]").forEach((input) => {
    const updatePathValue = async () => {
      const path = input.dataset.path;
      const value = input.type === "number" ? Number(input.value) : input.value;
      const isTypedCreationField = path === "class" || path === "race" || path === "subrace" || path === "alignment" || path === "background";

      if (isTypedCreationField) {
        state.character = updateCreationField(state.character, path, String(value), {
          backgroundSkillProficiencies: (backgroundName) => backgroundSkillProficiencies(backgroundName),
          defaultSaves,
          defaultSubrace,
          maxLevelOneHp,
        });
      } else {
        setByPath(state.character, path, value);
      }

      const needsFullRender = path === "class" || path === "race" || path === "subrace" || path === "alignment" || path === "abilityMethod" || path.startsWith("abilities.") || path.startsWith("asiChoices.");
      if (path === "class") {
        await loadClassData(String(value));
      }
      if (input.dataset.path.startsWith("abilities.") && state.character.level === 1) {
        state.character.hp = maxLevelOneHp(state.character.class, state.character.abilities);
      }
      if (path === "abilityMethod") {
        applyAbilityMethod(String(value));
      }
      if (path === "race") {
        await loadRaceData(String(value));
      }
      normalizeCharacterState();
      persist();
      renderChrome();
      if (needsFullRender) render();
      else renderSheet();
    };
    input.addEventListener("input", updatePathValue);
    if (input.tagName === "SELECT") input.addEventListener("change", updatePathValue);
  });

  els.form.querySelectorAll("[data-ability-adjust]").forEach((button) => {
    button.addEventListener("click", () => {
      adjustPointBuyAbility(button.dataset.abilityAdjust, Number(button.dataset.delta));
      normalizeCharacterState();
      persist();
      render();
    });
  });

  bindStandardArrayDrag();

  els.form.querySelectorAll("[data-class-feature-choice]").forEach((input) => {
    input.addEventListener("change", () => {
      state.character.classFeatureChoices ??= {};
      state.character.classFeatureChoices[input.dataset.classFeatureChoice] = input.value;
      normalizeCharacterState();
      persist();
      render();
    });
  });

  els.form.querySelectorAll("[data-asi-mode]").forEach((input) => {
    input.addEventListener("change", () => {
      state.character.asiChoices ??= {};
      const ruleId = input.dataset.asiMode;
      state.character.asiChoices[ruleId] = { ...normalizedAsiChoice({ id: ruleId }), mode: input.value };
      normalizeCharacterState();
      persist();
      render();
    });
  });

  els.form.querySelectorAll("[data-equipment-choice]").forEach((input) => {
    input.addEventListener("change", () => {
      state.character.equipmentChoices ??= {};
      state.character.equipmentChoices[input.dataset.equipmentChoice] = input.value;
      rebuildInventoryFromChoices();
      normalizeCharacterState();
      persist();
      render();
    });
  });

  // Background spell choices (Magic Initiate)
els.form.querySelectorAll("[data-bg-spell]").forEach((input) => {
  input.addEventListener("change", (e) => {
    state.character.bgSpellChoices = state.character.bgSpellChoices || {};
    const key = e.target.dataset.bgSpell;
    const value = e.target.value;
    const checked = e.target.checked;
    if (!state.character.bgSpellChoices[key]) {
      state.character.bgSpellChoices[key] = [];
    }
    if (checked) {
      if (!state.character.bgSpellChoices[key].includes(value)) {
        state.character.bgSpellChoices[key].push(value);
      }
    } else {
      state.character.bgSpellChoices[key] = state.character.bgSpellChoices[key].filter(v => v !== value);
    }
    persist();
    render();
  });
});

  // Background step event handlers
els.form.querySelectorAll("[data-bg-select]").forEach((select) => {
  select.addEventListener("change", (e) => {
    state.character = applyBackgroundStepSelection(
      state.character,
      e.target.value,
      (backgroundName) => backgroundSkillProficiencies(backgroundName)
    );
    normalizeCharacterState();
    persist();
    render();
  });
});

els.form.querySelectorAll("[data-bg-increment]").forEach((input) => {
  input.addEventListener("change", () => {
    state.character.bgChoices = applyGuidedBackgroundIncrement(
      ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background),
      input.value
    );
    normalizeCharacterState();
    persist();
    render();
  });
});

els.form.querySelectorAll("[data-bg-ability]").forEach((input) => {
  input.addEventListener("change", () => {
    const ability = input.dataset.bgAbility;
    state.character.bgChoices = toggleGuidedBackgroundAbility(
      ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background),
      ability,
      input.checked
    );
    normalizeCharacterState();
    persist();
    render();
  });
});

els.form.querySelectorAll("[data-bg-equipment]").forEach((input) => {
  input.addEventListener("change", () => {
    state.character.bgChoices = applyGuidedBackgroundEquipmentChoice(
      ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background),
      input.value
    );
    normalizeCharacterState();
    persist();
    render();
  });
});

els.form.querySelectorAll("[name='spellcasting-ability']").forEach((input) => {
  input.addEventListener("change", () => {
    state.character.bgChoices = applyGuidedBackgroundSpellcastingAbility(
      ensureGuidedBackgroundChoiceState(state.character.bgChoices, state.character.background),
      input.value
    );
    normalizeCharacterState();
    persist();
    render();
  });
});

els.form.querySelectorAll("[data-level-hp-gain]").forEach((input) => {
    input.addEventListener("input", () => {
      setLevelUpHpGain(Number(input.value));
      persist();
      render();
    });
  });

  els.form.querySelectorAll("[data-hp-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      setLevelUpHpGain(Number(button.dataset.hpPreset));
      persist();
      render();
    });
  });

  els.form.querySelector("[data-cancel-level-up]")?.addEventListener("click", () => {
    cancelLevelUpAssistant();
    persist();
    render();
  });

  els.form.querySelector("[data-apply-level-up]")?.addEventListener("click", () => {
    if (!validateStep("leveling")) {
      persist();
      render();
      return;
    }
    state.validationMessage = "";
    state.creationComplete = true;
    state.character.creationComplete = true;
    state.builderVisible = false;
    state.levelUpMode = false;
    state.levelUpSnapshot = null;
    normalizeCharacterState(); // Recalcular derived.maxHp agora com o novo level
    persist();
    render();
  });

  els.form.querySelectorAll("[data-list]").forEach((input) => {
    input.addEventListener("change", () => {
      updateChoiceList(input.dataset.list, input.value, input.checked);
      normalizeCharacterState();
      persist();
      render();
    });
  });

  els.form.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.step === "background" && !state.character.background && state.character.bgChoices?.background) {
        state.character.background = state.character.bgChoices.background;
      }
      const index = STEPS.findIndex(([id]) => id === state.step);
      const nextIndex = Number(button.dataset.move);
      const finishing = button.dataset.finishBuilder !== undefined;
      if ((nextIndex > index || finishing) && !validateStepRange(index, finishing ? STEPS.length : nextIndex)) {
        persist();
        render();
        return;
      }
      state.validationMessage = "";
      if (finishing) {
        state.creationComplete = true;
        state.character.creationComplete = true;
        state.builderVisible = false;
        state.levelUpMode = false;
      } else {
        state.step = STEPS[nextIndex][0];
      }
      persist();
      render();
    });
  });

  els.form.querySelectorAll("[data-remove-attack]").forEach((button) => {
    button.addEventListener("click", () => {
      state.character.attacks.splice(Number(button.dataset.removeAttack), 1);
      persist();
      render();
    });
  });

  const addAttackButton = els.form.querySelector("#addAttackButton");
  if (addAttackButton) {
    addAttackButton.addEventListener("click", () => {
      state.character.attacks.push({ name: "New", range: "5 feet", type: "Bludgeoning", damage: "1d4" });
      persist();
      render();
    });
  }

  const suggestAttacksButton = els.form.querySelector("#suggestAttacksButton");
  if (suggestAttacksButton) {
    suggestAttacksButton.addEventListener("click", () => {
      state.character.attacks = structuredClone(STARTER_ATTACKS[state.character.class] ?? STARTER_ATTACKS.fighter);
      persist();
      render();
    });
  }

}

function bindStandardArrayDrag() {
  let draggedAbility = "";
  let selectedAbility = "";
  els.form.querySelectorAll("[data-standard-ability]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      draggedAbility = card.dataset.standardAbility;
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedAbility);
    });
    card.addEventListener("dragend", () => {
      draggedAbility = "";
      card.classList.remove("dragging");
      els.form.querySelectorAll("[data-standard-ability]").forEach((item) => item.classList.remove("drag-over"));
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (card.dataset.standardAbility !== draggedAbility) card.classList.add("drag-over");
      event.dataTransfer.dropEffect = "move";
    });
    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      const from = event.dataTransfer.getData("text/plain") || draggedAbility;
      const to = card.dataset.standardAbility;
      swapStandardArrayAbilities(from, to);
    });
    card.addEventListener("click", () => {
      const ability = card.dataset.standardAbility;
      if (!selectedAbility) {
        selectedAbility = ability;
        card.classList.add("selected");
        return;
      }
      if (selectedAbility === ability) {
        selectedAbility = "";
        card.classList.remove("selected");
        return;
      }
      swapStandardArrayAbilities(selectedAbility, ability);
    });
  });
}

function swapStandardArrayAbilities(from, to) {
  if (!from || !to || from === to) return;
  state.character.abilities = swapAbilities(state.character.abilities, from, to);
  normalizeCharacterState();
  persist();
  render();
}

function renderSheet() {
  els.sheetView.innerHTML = sheetRenderers[state.tab]();
  bindSheetEvents();
}

function bindSheetEvents() {
  els.sheetView.querySelectorAll("[data-spell-name]").forEach((button) => {
    button.addEventListener("click", async () => {
      const spellName = button.dataset.spellName;
      if (state.selectedSpell === spellName) {
        state.selectedSpell = "";
        persist();
        renderSheet();
        return;
      }
      state.selectedSpell = spellName;
      persist();
      renderSheet();
      await loadSpellDetails(state.selectedSpell);
      renderSheet();
    });
  });

  const closeSpellButton = els.sheetView.querySelector("[data-close-spell]");
  if (closeSpellButton) {
    closeSpellButton.addEventListener("click", () => {
      state.selectedSpell = "";
      persist();
      renderSheet();
    });
  }

  // Info button - shows spell details without selecting it
  els.sheetView.querySelectorAll("[data-spell-info]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      const spellName = button.dataset.spellInfo;
      await loadSpellDetails(spellName);
      renderSheet();
    });
  });

  els.sheetView.querySelectorAll("[data-feature-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.featureFilter = button.dataset.featureFilter;
      state.selectedFeature = "";
      persist();
      renderSheet();
    });
  });

  els.sheetView.querySelectorAll("[data-feature-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const featureId = button.dataset.featureId;
      state.selectedFeature = state.selectedFeature === featureId ? "" : featureId;
      persist();
      renderSheet();
    });
  });

  els.sheetView.querySelectorAll("[data-action-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.actionFilter = button.dataset.actionFilter;
      state.selectedAction = "";
      persist();
      renderSheet();
    });
  });

  els.sheetView.querySelectorAll("[data-action-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.actionId;
      state.selectedAction = state.selectedAction === id ? "" : id;
      persist();
      renderSheet();
    });
  });

  els.sheetView.querySelectorAll("[data-use-resource]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      useResource(button.dataset.useResource);
      persist();
      render();
    });
  });

  els.sheetView.querySelectorAll("[data-use-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      useAction(button.dataset.useAction);
      persist();
      render();
    });
  });

  els.sheetView.querySelectorAll("[data-open-hp-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      openHpModal();
    });
  });

  const closeFeatureButton = els.sheetView.querySelector("[data-close-feature]");
  if (closeFeatureButton) {
    closeFeatureButton.addEventListener("click", () => {
      state.selectedFeature = "";
      persist();
      renderSheet();
    });
  }

  els.sheetView.querySelectorAll("[data-toggle-equip]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleEquipItem(button.dataset.toggleEquip);
      normalizeCharacterState();
      persist();
      render();
    });
  });

  els.sheetView.querySelectorAll("[data-cast-spell-level]").forEach((button) => {
    button.addEventListener("click", () => {
      castSpell(Number(button.dataset.castSpellLevel));
      persist();
      renderSheet();
    });
  });

  els.sheetView.querySelectorAll("[data-rest-type]").forEach((button) => {
    button.addEventListener("click", () => {
      applyRest(button.dataset.restType);
      persist();
      render();
    });
  });
}

function renderHpModal() {
  return modalRenderers.renderHpModal();
}


function renderRestModal() {
  return modalRenderers.renderRestModal();
}
function openHpModal(mode = "damage") {
  state.hpModalOpen = true;
  state.hpModalMode = mode;
  state.hpModalAmount = 0;
  state.hpModalTempAmount = 0;
  renderHpModal();

 renderRestModal();
}

function closeHpModal() {
  if (!state.hpModalOpen) return;
  state.hpModalOpen = false;
  renderHpModal();

 renderRestModal();
}

function applyHpModalAction() {
  const amount = Math.max(0, Math.floor(Number(state.hpModalAmount) || 0));
  const tempAmount = Math.max(0, Math.floor(Number(state.hpModalTempAmount) || 0));
  if (state.hpModalMode === "heal") {
    state.character.hp = Math.min(maxHitPoints(), (Number(state.character.hp) || 0) + amount);
  } else if (state.hpModalMode === "temp") {
    state.character.tempHp = Math.max(Number(state.character.tempHp) || 0, tempAmount);
  } else {
    applyDamage(amount);
  }
  state.validationMessage = state.hpModalMode === "heal"
    ? `Curado em ${amount} HP.`
    : state.hpModalMode === "temp"
      ? `${tempAmount} Temporary HP aplicados.`
      : `Recebeu ${amount} de dano.`;
  closeHpModal();
  persist();
  render();
}

function applyDamage(amount) {
  let remaining = Math.max(0, Math.floor(Number(amount) || 0));
  const tempHp = Math.max(0, Number(state.character.tempHp) || 0);
  if (tempHp > 0) {
    const absorbed = Math.min(tempHp, remaining);
    state.character.tempHp = tempHp - absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) {
    state.character.hp = Math.max(0, Number(state.character.hp) - remaining);
  }
}

function currentActionItems() {
  return deriveAvailableActions(actionEngineContext());
}

function actionEngineContext() {
  return {
    character: {
      ...state.character,
      spells: knownSheetSpellNames(),
      spellEntries: currentSheetSpellEntries(),
    },
    projection: state.derived,
    resourceDefinitions: currentResourceDefinitions(),
    spellDetails: state.api.source?.spellDetails ?? {},
    loadedSpellDetails: state.api.spellDetails ?? {},
    compactRange,
    rangeLabel,
    signed,
    slugify: slugifyName,
    itemTypeLabel,
    itemTags,
    entriesToText,
    resourceRecoveryLabel,
  };
}

function knownSheetSpellNames() {
  return typedCurrentKnownSpellNames(state.character, state.api, currentFeatureItems());
}

function currentSheetSpellEntries() {
  return typedCurrentSpellEntries(state.character, state.api, currentFeatureItems());
}

function autoGrantedSpellEntries() {
  return typedAutoGrantedSpellEntries(state.character, state.api, currentFeatureItems());
}

function autoGrantedCantripNames() {
  return autoGrantedSpellEntries().filter((spell) => spell.level === 0).map((spell) => spell.name);
}

function autoGrantedSpellNameSet() {
  return new Set(autoGrantedSpellEntries().map((spell) => spell.name));
}

function currentFeatureItems() {
  return deriveActiveFeatures(state.character, state.api, classCreationChoiceRules());
}

function currentResourceDefinitions() {
  const byId = new Map();
  const resources = [
    ...currentFeatureItems()
    .map((feature) => feature.resource)
    .filter(Boolean),
    ...typedBackgroundSpellResourceDefinitions(state.character, state.api),
  ];

  resources.forEach((resource) => {
      const existing = byId.get(resource.id);
      if (!existing) {
        byId.set(resource.id, resource);
        return;
      }
      byId.set(resource.id, {
        ...existing,
        recovery: { ...(existing.recovery ?? {}), ...(resource.recovery ?? {}) },
        max: Math.max(Number(existing.max) || 0, Number(resource.max) || 0),
        actionKind: existing.actionKind || resource.actionKind,
        body: existing.body || resource.body,
        sourceLabel: existing.sourceLabel || resource.sourceLabel,
        isCanonical: Boolean(existing.isCanonical || resource.isCanonical),
      });
    });
  return [...byId.values()].sort((a, b) => (Number(a.level) - Number(b.level)) || a.name.localeCompare(b.name));
}

function resourceRecoveryFromBody(body) {
  return typedResourceRecoveryFromBody(body);
}

function resourceActionKindFromBody(body) {
  return typedResourceActionKindFromBody(body);
}

function classCreationChoiceRules() {
  return sortChoiceRules([
    ...asiChoiceRules(),
    ...featPickRules(),
    ...classFeatureOptionRules(),
    ...dependentClassChoiceRules(),
    ...subclassChoiceRules(),
    ...fightingStyleRules(),
  ]);
}

function activeChoiceRulesForValidation() {
  return state.levelUpMode ? levelScopedChoiceRules() : classCreationChoiceRules();
}

function levelScopedChoiceRules() {
  const from = Number(state.levelUpFrom) || 0;
  return classCreationChoiceRules().filter((rule) => Number(rule.level ?? 1) > from && Number(rule.level ?? 1) <= state.character.level);
}

function sortChoiceRules(rules) {
  return [...rules].sort((a, b) => (Number(a.level ?? 1) - Number(b.level ?? 1)) || String(a.name).localeCompare(String(b.name)));
}

function choiceLocked(rule) {
  if (state.levelUpMode) return false;
  if (creationChoicesLocked()) return true;
  if (state.builderVisible !== false) return false;
  return isRuleComplete(rule);
}

function creationChoicesLocked() {
  return !state.levelUpMode && (Boolean(state.creationComplete || state.character.creationComplete) || Number(state.character.level) > 1);
}

function isRuleComplete(rule) {
  if (rule.type === "asi") return isAsiChoiceComplete(rule);
  return Boolean(state.character.classFeatureChoices?.[rule.id]);
}

function featPickRules() {
  return (state.api.source?.classFeatures ?? [])
    .filter((feature) =>
      slugifyName(feature.className) === state.character.class &&
      Number(feature.level) <= state.character.level &&
      /epic boon/i.test(feature.name)
    )
    .map((feature) => ({
      id: `feat-${feature.level}-${slugifyName(feature.name)}`,
      name: `${feature.name} (Nivel ${feature.level})`,
      count: 1,
      level: Number(feature.level),
      summary: clean5etoolsText(feature.body) || "Escolha um feat qualificado.",
      options: qualifiedFeatOptions("EB").map(([value, label]) => ({ value, label, hint: state.api.source?.featDetails?.[value]?.body?.split(/\n{2,}|\n/)[0] ?? "" })),
    }));
}

function asiChoiceRules() {
  return (state.api.source?.classFeatures ?? [])
    .filter((feature) =>
      slugifyName(feature.className) === state.character.class &&
      Number(feature.level) <= state.character.level &&
      /ability score improvement/i.test(feature.name)
    )
    .map((feature) => ({
      id: `asi-${feature.level}`,
      type: "asi",
      name: `${feature.name} (Nivel ${feature.level})`,
      count: 1,
      level: Number(feature.level),
      featCategory: Number(feature.level) >= 19 ? "EB" : "G",
      summary: clean5etoolsText(feature.body) || "Escolha aumentar atributos ou selecionar um feat qualificado.",
    }));
}

function subclassChoiceRules() {
  const subclassFeature = (state.api.source?.classFeatures ?? []).find((feature) =>
    slugifyName(feature.className) === state.character.class &&
    Number(feature.level) <= state.character.level &&
    /subclass/i.test(feature.name)
  );
  if (!subclassFeature) return [];
  const className = state.api.classes[state.character.class]?.name ?? titleCase(state.character.class);
  const options = (state.api.source?.subclasses ?? [])
    .filter((subclass) => subclass.className === className && subclass.source === "XPHB")
    .map((subclass) => ({
      value: slugifyName(subclass.name),
      label: subclass.name,
      hint: `${subclass.source}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  if (!options.length) return [];
  return [{
    id: "subclass",
    name: subclassFeature.name,
    count: 1,
    level: Number(subclassFeature.level),
    summary: `Escolha a subclasse de ${className} liberada no nivel ${subclassFeature.level}.`,
    options,
  }];
}

function dependentClassChoiceRules() {
  const choices = state.character.classFeatureChoices ?? {};
  if (state.character.class === "druid" && choices["primal-order"] === "magician") {
    return [{
      id: "magician-skill",
      name: "Magician Skill Bonus",
      count: 1,
      level: 1,
      summary: "Escolha Arcana ou Nature para receber bonus igual ao modificador de Wisdom, minimo +1.",
      options: [
        { value: "arcana", label: "Arcana", hint: `Bonus atual: ${signed(Math.max(1, deriveProjectedAbilityModifier(state.character, "wis")))}` },
        { value: "nature", label: "Nature", hint: `Bonus atual: ${signed(Math.max(1, deriveProjectedAbilityModifier(state.character, "wis")))}` },
      ],
    }];
  }
  return [];
}

function classFeatureOptionRules() {
  return (state.api.source?.classFeatures ?? [])
    .filter((feature) => slugifyName(feature.className) === state.character.class && Number(feature.level) <= state.character.level)
    .map((feature) => {
      const refs = classFeatureOptionRefs(feature.entries);
      if (!refs.length) return null;
      return {
        id: slugifyName(feature.name),
        name: feature.name,
        count: 1,
        level: Number(feature.level),
        summary: firstTextEntry(feature.entries) || "Escolha uma opcao desta feature.",
        options: refs.map((ref) => {
          const optionFeature = classFeatureByRef(ref);
          return {
            value: slugifyName(optionFeature?.name ?? ref),
            label: optionFeature?.name ?? ref.split("|")[0],
            hint: optionFeature?.body ? optionFeature.body.split(/\n{2,}|\n/)[0] : "",
          };
        }),
      };
    })
    .filter(Boolean);
}

function fightingStyleRules() {
  const hasFightingStyle = (state.api.source?.classFeatures ?? []).some((feature) =>
    slugifyName(feature.className) === state.character.class &&
    feature.name === "Fighting Style" &&
    Number(feature.level) <= state.character.level
  );
  if (!hasFightingStyle) return [];
  const options = Object.values(state.api.source?.featDetails ?? {})
    .filter((feat) => feat.category === "FS")
    .map((feat) => ({
      value: slugifyName(feat.name),
      label: feat.name,
      hint: feat.body.split(/\n{2,}|\n/)[0] ?? "",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  if (!options.length) return [];
  return [{
    id: "fighting-style",
    name: "Fighting Style",
    count: 1,
    level: 1,
    summary: "Escolha um Fighting Style feat da lista 2024.",
    options,
  }];
}

function normalizedAsiChoice(rule, input = state.character.asiChoices?.[rule.id]) {
  const choice = input ?? {};
  const ability1 = choice.ability1 && ABILITIES.some(([key]) => key === choice.ability1) ? choice.ability1 : defaultAsiAbility();
  const ability2Fallback = ABILITIES.find(([key]) => key !== ability1)?.[0] ?? "dex";
  return {
    mode: choice.mode === "feat" ? "feat" : "asi",
    pattern: choice.pattern === "plus1plus1" ? "plus1plus1" : "plus2",
    ability1,
    ability2: choice.ability2 && choice.ability2 !== ability1 && ABILITIES.some(([key]) => key === choice.ability2) ? choice.ability2 : ability2Fallback,
    feat: choice.feat ?? "",
  };
}

function isAsiChoiceComplete(rule) {
  if (!state.character.asiChoices?.[rule.id]) return false;
  const choice = normalizedAsiChoice(rule);
  if (choice.mode === "feat") return Boolean(choice.feat);
  if (choice.pattern === "plus2") return deriveProjectedAbilityScore(state.character, choice.ability1, { omitAsiRuleId: rule.id }) <= 18;
  return Boolean(choice.ability1 && choice.ability2 && choice.ability1 !== choice.ability2);
}

function qualifiedFeatOptions(category = "G") {
  const feats = Object.values(state.api.source?.featDetails ?? {})
    .filter((feat) => feat.category === category || (category === "G" && feat.name === "Ability Score Improvement"))
    .filter((feat) => qualifiesForFeat(feat))
    .map((feat) => [slugifyName(feat.name), feat.name])
    .sort((a, b) => a[1].localeCompare(b[1]));
  return feats.length ? feats : [["ability-score-improvement", "Ability Score Improvement"]];
}

function qualifiesForFeat(feat) {
  const prerequisites = feat.prerequisite ?? [];
  if (!prerequisites.length) return true;
  return prerequisites.some((prereq) => {
    if (prereq.level && state.character.level < prereq.level) return false;
    if (prereq.ability) {
      return prereq.ability.some((abilityReq) =>
        Object.entries(abilityReq).every(([key, value]) => deriveProjectedAbilityScore(state.character, key) >= value)
      );
    }
    if (prereq.spellcasting2020 && !typedClassHasSpellList(state.character.class, state.api)) return false;
    return true;
  });
}

function asiAbilityOptions(exclude = "") {
  return ABILITIES
    .filter(([key]) => key !== exclude)
    .map(([key, label]) => [key, `${label} (${deriveProjectedAbilityScore(state.character, key)})`]);
}

function defaultAsiAbility() {
  const preferred = typedSpellAbility(state.character, state.api);
  return ABILITIES.some(([key]) => key === preferred) ? preferred : "con";
}

function classFeatureOptionRefs(entries) {
  const refs = [];
  walkEntries(entries, (entry) => {
    if (entry?.type !== "options") return;
    (entry.entries ?? []).forEach((option) => {
      if (option.type === "refClassFeature" && option.classFeature) refs.push(option.classFeature);
    });
  });
  return refs;
}

function classFeatureByRef(ref) {
  const [name, className, classSource, level] = String(ref).split("|");
  return (state.api.source?.classFeatures ?? []).find((feature) =>
    feature.name === name &&
    feature.className === className &&
    feature.classSource === classSource &&
    String(feature.level) === String(level)
  );
}

function firstTextEntry(entries) {
  return (entries ?? []).find((entry) => typeof entry === "string") ?? "";
}

function recoverShortRestResources() {
  return recoverShortRestResourcesImpl();
}

function skillNameFromSlug(value) {
  const normalized = String(value).toLowerCase();
  return SKILLS.find(([name]) => slugifyName(name) === slugifyName(normalized))?.[0] ?? titleCase(normalized);
}

function maxHitPoints() {
  return state.derived?.maxHp ?? 0;
}

function spellFromKnownData(name) {
  return typedSpellFromKnownData(name, state.api);
}

function classSkillRule() {
  const skillChoice = state.api.classes[state.character.class]?.startingProficiencies?.skills?.find((entry) => entry.choose?.from);
  if (skillChoice) {
    return {
      choose: skillChoice.choose.count ?? 1,
      options: skillChoice.choose.from.map(skillNameFromSlug),
    };
  }

  const apiChoice = state.api.classes[state.character.class]?.proficiency_choices?.find((choice) =>
    choice.type === "proficiencies" && optionNames(choice).some((name) => name.startsWith("Skill:"))
  );

  if (apiChoice) {
    return {
      choose: apiChoice.choose,
      options: optionNames(apiChoice).filter((name) => name.startsWith("Skill:")).map((name) => name.replace("Skill: ", "")),
    };
  }

  return { choose: 0, options: [] };
}

function subracesFor(raceName) {
  const key = slugifyName(raceName);
  const apiSubraces = state.api.races[key]?.subraces ?? [];
  return apiSubraces.length ? apiSubraces : [];
}

function defaultSubrace(raceName) {
  return subracesFor(raceName)[0] ?? "";
}

function levelUpCharacter() {
  if (state.character.level >= 20) return;
  state.character.level += 1;
  const gain = fixedHpGain();
  state.character.hp = (Number(state.character.hp) || 0) + gain;
  state.character.maxHp = state.character.hp;
  normalizeCharacterState();
  return gain;
}

function startLevelUpAssistant() {
  if (state.character.level >= 20) return;
  if (state.levelUpMode) return;
  state.levelUpMode = true;
  state.levelUpFrom = state.character.level;
  state.levelUpHpBase = state.character.hp;
  state.levelUpSnapshot = structuredClone(state.character);
  state.levelUpClassMode = "same";
  state.builderVisible = true;
  state.character.bgSpellChoices = {};
  state.creationComplete = true;
  state.character.creationComplete = true;
  const gain = levelUpCharacter();
  state.levelUpHpGain = gain;
  state.step = "leveling";
}

function cancelLevelUpAssistant() {
  if (state.levelUpSnapshot) {
    state.character = structuredClone(state.levelUpSnapshot);
    state.activeCharacterId = state.character.id;
  }
  state.levelUpMode = false;
  state.levelUpSnapshot = null;
  state.levelUpHpGain = 0;
  state.levelUpHpBase = 0;
  state.levelUpClassMode = "same";
  state.creationComplete = Boolean(state.character.creationComplete);
  if (state.creationComplete) state.builderVisible = false;
  normalizeCharacterState();
}

function setLevelUpHpGain(value) {
  if (!state.levelUpMode) return;
  const con = deriveProjectedAbilityModifier(state.character, "con");
  const min = Math.max(1, 1 + con);
  const max = calculateMaxHpGain((state.api.classes[state.character.class]?.hit_die ?? 8), con);
  state.levelUpHpGain = clamp(Number(value) || min, min, max);
  const newHp = (state.levelUpHpBase || 0) + state.levelUpHpGain;
  state.character.hp = newHp;
  state.character.maxHp = newHp;
}

function fixedHpGain() {
  return calculateFixedHpGain((state.api.classes[state.character.class]?.hit_die ?? 8), deriveProjectedAbilityModifier(state.character, "con"));
}

function maxLevelOneHp(className, abilities = state.character.abilities) {
  const die = state.api.classes?.[className]?.hit_die ?? CLASS_HIT_DIE[className] ?? 8;
  const bonuses = calculateCharacterAbilityBonuses(state.character);
  const scores = deriveAbilityScores(abilities ?? {}, bonuses);
  const hp = deriveLevelOneMaxHp(die, scores.con);
  state.character.maxHp = hp;
  return hp;
}

function normalizeSubrace() {
  const options = subracesFor(state.character.race);
  if (!options.length) {
    state.character.subrace = "";
    return;
  }
  if (!state.character.subrace || !options.includes(state.character.subrace)) state.character.subrace = options[0];
}

function spellChoiceRule() {
  const className = state.character.class;
  const levelRow = currentLevelRow();
  const spellcasting = levelRow?.spellcasting;
  const cantrips = (spellcasting?.cantrips_known ?? 0) + classFeatureCantripBonus() + autoGrantedCantripNames().length;

  if (!spellcasting || !typedClassHasSpellList(className, state.api) || typedCasterLevel(state.character, state.api) === 0) {
    return {
      cantrips: 0,
      spellsMax: 0,
      totalMax: 0,
      label: "permitidas pela classe",
      hint: "Esta classe nao recebe conjuracao pelos dados 5etools 2024 neste nivel.",
    };
  }

  if (Number.isFinite(spellcasting.prepared_spells)) {
    const prepared = spellcasting.prepared_spells;
    return {
      cantrips,
      spellsMax: prepared,
      totalMax: cantrips + prepared,
      label: "cantrips + preparadas",
      hint: `${titleCase(className)} prepara ${prepared} magia(s) e conhece ${cantrips} cantrip(s) neste nivel.`,
    };
  }

  const known = spellcasting.spells_known ?? 0;
  return {
    cantrips,
    spellsMax: known,
    totalMax: cantrips + known,
    label: "cantrips + conhecidas",
    hint: `${titleCase(className)} conhece ${known} magia(s) e ${cantrips} cantrip(s) neste nivel, conforme os dados 5etools 2024.`,
  };
}

function classFeatureCantripBonus() {
  const choices = state.character.classFeatureChoices ?? {};
  let bonus = 0;
  if (state.character.class === "druid" && choices["primal-order"] === "magician") bonus += 1;
  if (state.character.class === "cleric" && choices["divine-order"] === "thaumaturge") bonus += 1;
  return bonus;
}

function maxSpellLevelAvailable() {
  const className = state.character.class;
  if (!typedClassHasSpellList(className, state.api) || typedCasterLevel(state.character, state.api) === 0) return 0;
  const spellcasting = currentLevelRow()?.spellcasting;
  if (spellcasting) {
    for (let level = 9; level >= 1; level -= 1) {
      if ((spellcasting[`spell_slots_level_${level}`] ?? 0) > 0) return level;
    }
    return (spellcasting.cantrips_known ?? 0) > 0 ? 0 : 0;
  }
  return 0;
}

function currentLevelRow() {
  const levels = state.api.levels[state.character.class];
  return Array.isArray(levels) ? levels.find((level) => level.level === state.character.level) : undefined;
}

function optionNames(choice) {
  const from = choice?.from;
  if (!from || from.option_set_type !== "options_array") return [];
  return (from.options ?? []).map((option) => {
    if (option.option_type === "reference") return option.item?.name;
    if (option.option_type === "counted_reference") return option.of?.name;
    return option.item?.name ?? option.choice?.desc ?? option.string;
  }).filter(Boolean);
}

function normalizeCharacterState() {
  state.derived = null;
  delete state.character.events;
  state.characters = (state.characters ?? []).map((character) => {
    const next = { ...character };
    delete next.events;
    return next;
  });
  normalizeSourceSelections();
  state.character.abilityMethod ??= "standard";
  normalizeAbilityMethodState();
  state.character.tempHp = Math.max(0, Number(state.character.tempHp) || 0);
  if (state.character.level === 1 && !state.character.maxHp) state.character.hp = maxLevelOneHp(state.character.class, state.character.abilities);
  normalizeSubrace();
  state.character.classSkillChoices ??= deriveClassSkillChoices();
  state.character.classFeatureChoices ??= {};
  state.character.asiChoices ??= {};
  state.character.equipmentChoices ??= {};
  state.character.inventory ??= [];
  state.character.equippedItems ??= [];
  state.character.hitDiceUsed = clamp(Number(state.character.hitDiceUsed) || 0, 0, Number(state.character.level) || 1);
  state.character.spellSlots ??= {};
  state.character.resources ??= {};
  state.character.savingThrows = typedGetClassSavingThrows(state.character.class, state.api.classes);
  if (hasLoadedRules()) {
    enforceClassFeatureChoices();
    enforceEquipmentChoices();
  }
  enforceClassSkillLimit();
  syncSkillProficiencies();
  enforceSpellLimit();
  syncSpellSlots();
  syncResources();
  syncInventoryEffects();
  const activeModifiers = deriveActiveModifiers(state.character);
  state.derived = deriveCharacterSheet(state.character, {
    rules: ruleRepository,
    skills: SKILLS,
    abilityKeys: ABILITIES.map(([key]) => key),
    spellAbility: typedSpellAbility(state.character, state.api),
    modifiers: activeModifiers,
    apiClasses: state.api.classes,
    apiLevels: state.api.levels,
    baseArmorClass: state.character.armorClass - modifierTotal(activeModifiers, "armor_class"),
  });
}

function hasLoadedRules() {
  return Boolean(state.api.source?.classFeatures?.length && Object.keys(state.api.classes ?? {}).length);
}

function normalizeAbilityMethodState() {
  if (state.character.abilityMethod === "standard" && !isStandardArrayPermutation()) {
    state.character.abilities = Object.fromEntries(ABILITIES.map(([key], index) => [key, STANDARD_ARRAY[index]]));
  }
}

function isStandardArrayPermutation() {
  const current = ABILITIES.map(([key]) => Number(state.character.abilities[key])).sort((a, b) => a - b);
  return current.join(",") === [...STANDARD_ARRAY].sort((a, b) => a - b).join(",");
}

function enforceClassFeatureChoices() {
  const rules = classCreationChoiceRules();
  const nonAsiRules = rules.filter((rule) => rule.type !== "asi");
  const validRuleIds = new Set(nonAsiRules.map((rule) => rule.id));
  state.character.classFeatureChoices = Object.fromEntries(
    Object.entries(state.character.classFeatureChoices ?? {}).filter(([ruleId, value]) => {
      const rule = nonAsiRules.find((item) => item.id === ruleId);
      return validRuleIds.has(ruleId) && rule?.options.some((option) => option.value === value);
    })
  );
  enforceAsiChoices(rules.filter((rule) => rule.type === "asi"));
}

function enforceAsiChoices(rules) {
  const validRuleIds = new Set(rules.map((rule) => rule.id));
  state.character.asiChoices = Object.fromEntries(
    Object.entries(state.character.asiChoices ?? {})
      .filter(([ruleId]) => validRuleIds.has(ruleId))
      .map(([ruleId, choice]) => {
        const rule = rules.find((item) => item.id === ruleId);
        const normalized = normalizedAsiChoice(rule, choice);
        if (normalized.mode === "feat" && !qualifiedFeatOptions(rule.featCategory).some(([value]) => value === normalized.feat)) {
          normalized.feat = "";
        }
        return [ruleId, normalized];
      })
  );
}

function enforceEquipmentChoices() {
  const rules = equipmentChoiceRules();
  const valid = new Set(rules.map((rule) => rule.id));
  const before = JSON.stringify(state.character.equipmentChoices ?? {});
  state.character.equipmentChoices = Object.fromEntries(
    Object.entries(state.character.equipmentChoices ?? {}).filter(([ruleId, value]) => {
      const rule = rules.find((item) => item.id === ruleId);
      return valid.has(ruleId) && rule?.options.some((option) => option.value === value);
    })
  );
  const after = JSON.stringify(state.character.equipmentChoices ?? {});
  if (before !== after || !(state.character.inventory ?? []).length) rebuildInventoryFromChoices();
}

function normalizeSourceSelections() {
  const classOptions = state.api.source?.classOptions ?? [];
  if (classOptions.length && !classOptions.some(([value]) => value === state.character.class)) {
    state.character.class = classOptions[0][0];
  }
  const raceOptions = state.api.source?.raceOptions ?? [];
  if (raceOptions.length && !raceOptions.some(([value]) => value === state.character.race)) {
    state.character.race = raceOptions[0][0];
  }
  const backgroundOptions = state.api.source?.backgroundOptions ?? [];
  if (backgroundOptions.length && !backgroundOptions.some(([value]) => value === state.character.background)) {
    state.character.background = backgroundOptions[0][0];
  }
}

function deriveClassSkillChoices() {
  const rule = classSkillRule();
  const backgroundSkills = backgroundSkillProficiencies();
  return (state.character.skillProficiencies ?? [])
    .filter((skill) => rule.options.includes(skill) && !backgroundSkills.includes(skill))
    .slice(0, rule.choose);
}

function enforceClassSkillLimit() {
  const rule = classSkillRule();
  const backgroundSkills = backgroundSkillProficiencies();
  state.character.classSkillChoices = [...new Set(state.character.classSkillChoices ?? [])]
    .filter((skill) => rule.options.includes(skill) && !backgroundSkills.includes(skill))
    .slice(0, rule.choose);
}

function syncSkillProficiencies() {
  const rule = classSkillRule();
  const backgroundSkills = backgroundSkillProficiencies();
  const existingOtherSkills = (state.character.skillProficiencies ?? [])
    .filter((skill) => !rule.options.includes(skill))
    .filter((skill) => !backgroundSkills.includes(skill));
  state.character.skillProficiencies = [...new Set([...backgroundSkills, ...existingOtherSkills, ...state.character.classSkillChoices])];
}

function backgroundSkillProficiencies(backgroundName = state.character.background) {
  const name = String(backgroundName || "").toLowerCase();
  const background = state.api.source?.backgroundDetails?.[name];
  if (!background) return [];

  return [...new Set((background.skillProficiencies ?? []).flatMap((group) => {
    if (!group || typeof group !== "object") return [];
    return Object.entries(group)
      .filter(([, enabled]) => enabled === true)
      .map(([slug]) => skillNameFromSlug(slug));
  }))];
}


// Magic Initiate Background Spell Choices
function getBackgroundGrantedSpells() {
  return getMagicInitiateBackgroundGrants(state.character.background, state.api.source?.backgroundDetails);
}

function backgroundSpellChoiceRules() {
  return createMagicInitiateSpellRules(getBackgroundGrantedSpells());
}

function renderBgSpellChoice(rule) {
  const storageKey = `bg-${rule.id}`;
  const selected = state.character.bgSpellChoices?.[storageKey] || [];
  const locked = creationChoicesLocked();
  const spellList = rule.spellList?.toLowerCase() || '';
  const listSpells = backgroundSpellOptions(spellList);
  const cantrips = listSpells.filter(s => s.level === 0).map(s => s.name);
  const level1 = listSpells.filter(s => s.level === 1).map(s => s.name);
  const selectedCantrips = selected.filter(s => cantrips.includes(s));
  const selectedLevel1 = selected.filter(s => level1.includes(s));
  return `
    <fieldset class="choice-group bg-spell-choice">
      <legend>${escapeHtml(rule.name)}</legend>
      <p class="choice-counter">${selectedCantrips.length}/${rule.cantrips} cantrips e ${selectedLevel1.length}/${rule.level1Spells} magias de nivel 1</p>
      <h4>Cantrips (escolha ${rule.cantrips})</h4>
      <div class="choice-list">
        ${cantrips.map(name => {
          const isSelected = selected.includes(name);
          const disabled = locked || (!isSelected && selectedCantrips.length >= rule.cantrips);
          return `<label><input type="checkbox" data-bg-spell="${storageKey}" value="${name}" ${isSelected ? 'checked' : ''} ${disabled ? 'disabled' : ''}/> ${escapeHtml(name)}</label>`;
        }).join('')}
      </div>
      <h4>Magias de 1° nivel (escolha ${rule.level1Spells})</h4>
      <div class="choice-list">
        ${level1.map(name => {
          const isSelected = selected.includes(name);
          const disabled = locked || (!isSelected && selectedLevel1.length >= rule.level1Spells);
          return `<label><input type="checkbox" data-bg-spell="${storageKey}" value="${name}" ${isSelected ? 'checked' : ''} ${disabled ? 'disabled' : ''}/> ${escapeHtml(name)}</label>`;
        }).join('')}
      </div>
    </fieldset>
  `;
}

function backgroundSpellOptions(spellList) {
  return getMagicInitiateSpellOptions(spellList, state.api.classSpells);
}

function enforceSpellLimit() {
  const rule = spellChoiceRule();
  const legalNames = legalSpellNames();
  const autoGranted = autoGrantedSpellNameSet();
  const next = [];
  let cantrips = autoGrantedCantripNames().length;
  let leveled = 0;
  [...new Set(state.character.spells ?? [])]
    .filter((name) => legalNames.size === 0 ? true : legalNames.has(name))
    .forEach((name) => {
      const spell = spellFromKnownData(name);
      if (!spell || !Number.isFinite(spell.level)) return;
      if (autoGranted.has(name)) return;
      if (spell.level === 0) {
        if (cantrips >= rule.cantrips) return;
        cantrips += 1;
      } else {
        if (leveled >= rule.spellsMax) return;
        leveled += 1;
      }
      next.push(name);
  });
  state.character.spells = next;
  state.selectedSpell = typedResolveSelectedSpellName(state.selectedSpell, knownSheetSpellNames());
}

function syncInventoryEffects() {
  const inventory = state.character.inventory ?? [];
  state.character.equippedItems ??= [];
  const equipped = inventory.filter((item) => state.character.equippedItems.includes(item.id));
  const armor = equipped.find((item) => isArmorItem(item));
  const activeModifiers = deriveActiveModifiers(state.character);
  const dex = deriveProjectedAbilityModifier(state.character, "dex");
  const armorBase = armor?.ac ? Number(armor.ac) + armorDexBonus(armor, dex) : 10 + dex;
  state.character.armorClass = armorBase + modifierTotal(activeModifiers, "armor_class");
  const manualAttacks = (state.character.attacks ?? []).filter((attack) => !attack.fromInventory);
  const itemAttacks = equipped.filter(isWeaponItem).map(attackFromInventoryItem);
  state.character.attacks = [...manualAttacks, ...itemAttacks];
}

function toggleEquipItem(id) {
  const item = (state.character.inventory ?? []).find((entry) => entry.id === id);
  if (!item || !isEquipableItem(item)) return;
  state.character.equippedItems ??= [];
  const equipped = state.character.equippedItems.includes(id);
  if (equipped) {
    state.character.equippedItems = state.character.equippedItems.filter((itemId) => itemId !== id);
    return;
  }
  if (isArmorItem(item)) {
    state.character.equippedItems = state.character.equippedItems.filter((itemId) => {
      const other = state.character.inventory.find((entry) => entry.id === itemId);
      return !isArmorItem(other);
    });
  }
  state.character.equippedItems.push(id);
}

function isEquipableItem(item) {
  return isShieldItem(item) || isArmorItem(item) || isWeaponItem(item) || itemHasModifiers(item);
}

function itemHasModifiers(item) {
  return Boolean(item?.modifier || item?.modifiers?.length || /ring of protection/i.test(String(item?.name ?? "")));
}

function isShieldItem(item) {
  return String(item?.type ?? "").startsWith("S");
}

function isArmorItem(item) {
  return ["LA", "MA", "HA"].some((prefix) => String(item?.type ?? "").startsWith(prefix));
}

function isWeaponItem(item) {
  return Boolean(item?.damage);
}

function armorDexBonus(item, dex) {
  const type = String(item?.type ?? "");
  if (type.startsWith("MA")) return Math.min(2, dex);
  if (type.startsWith("HA")) return 0;
  return dex;
}

function attackFromInventoryItem(item) {
  return {
    name: item.name,
    range: "5 feet",
    type: damageTypeLabel(item.damageType),
    damage: item.damage,
    fromInventory: true,
    itemId: item.id,
  };
}

function applyAbilityMethod(method) {
  state.character.abilities = typedApplyAbilityMethod(state.character.abilities, method);
  state.character.abilityMethod = method;
}

function adjustPointBuyAbility(key, delta) {
  const result = typedAdjustPointBuyScore(state.character.abilities, key, delta);
  state.character.abilities = result;
}

function pointBuySpent() {
  return typedPointBuySpent(state.character.abilities);
}

function updateChoiceList(listName, value, checked) {
  if (listName === "savingThrows") return;
  const current = state.character[listName] ?? [];
  const next = checked ? [...current, value] : current.filter((item) => item !== value);
  state.character[listName] = [...new Set(next)];
}

function defaultSaves(className) {
  const saves = {
    barbarian: ["str", "con"],
    bard: ["dex", "cha"],
    cleric: ["wis", "cha"],
    druid: ["int", "wis"],
    fighter: ["str", "con"],
    monk: ["str", "dex"],
    paladin: ["wis", "cha"],
    ranger: ["str", "dex"],
    rogue: ["dex", "int"],
    sorcerer: ["con", "cha"],
    warlock: ["wis", "cha"],
    wizard: ["int", "wis"],
  };
  return saves[className] ?? ["str", "dex"];
}
