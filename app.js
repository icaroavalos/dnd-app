import { deriveCharacterSheet } from "./src/core/character/character-projection.js";
import { deriveAvailableActions } from "./src/core/engine/action-engine.js";
import { deriveActiveModifiers, modifierTotal } from "./src/core/engine/modifier-engine.js";
import { RuleRepository } from "./src/core/rules/rule-repository.js";

const DATA_SOURCE = "data/5etools/5e-2024";
const DATA_SOURCE_LABEL = "5etools 2024";

const ABILITIES = [
  ["str", "Strength"],
  ["dex", "Dexterity"],
  ["con", "Constitution"],
  ["int", "Intelligence"],
  ["wis", "Wisdom"],
  ["cha", "Charisma"],
];

const ABILITY_METHODS = [
  ["standard", "Standard Array"],
  ["manual", "Manual/Rolled"],
  ["pointBuy", "Point Buy"],
];

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_BUY_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUY_BUDGET = 27;

const SKILLS = [
  ["Athletics", "str"],
  ["Acrobatics", "dex"],
  ["Sleight of Hand", "dex"],
  ["Stealth", "dex"],
  ["Arcana", "int"],
  ["History", "int"],
  ["Investigation", "int"],
  ["Nature", "int"],
  ["Religion", "int"],
  ["Animal Handling", "wis"],
  ["Insight", "wis"],
  ["Medicine", "wis"],
  ["Perception", "wis"],
  ["Survival", "wis"],
  ["Deception", "cha"],
  ["Intimidation", "cha"],
  ["Performance", "cha"],
  ["Persuasion", "cha"],
];

const CLASSES = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
];

const RACES = [
  "dragonborn",
  "dwarf",
  "elf",
  "gnome",
  "half-elf",
  "half-orc",
  "halfling",
  "human",
  "tiefling",
];

const SUBRACES = {
  dragonborn: ["Dragonborn"],
  dwarf: ["Hill Dwarf", "Mountain Dwarf"],
  elf: ["High Elf", "Wood Elf", "Dark Elf"],
  gnome: ["Forest Gnome", "Rock Gnome"],
  "half-elf": ["Half Elf"],
  "half-orc": ["Half Orc"],
  halfling: ["Lightfoot Halfling", "Stout Halfling"],
  human: ["Human"],
  tiefling: ["Tiefling"],
  Turtle: ["Turtle"],
};

const BACKGROUNDS = ["Acolyte", "Criminal", "Folk Hero", "Guild Artisan", "Hermit", "Noble", "Outlander", "Sage", "Sailor", "Soldier"];

const CLASS_HIT_DIE = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
};

const CLASS_SKILLS = {
  barbarian: { choose: 2, options: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] },
  bard: { choose: 3, options: SKILLS.map(([name]) => name) },
  cleric: { choose: 2, options: ["History", "Insight", "Medicine", "Persuasion", "Religion"] },
  druid: { choose: 2, options: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"] },
  fighter: { choose: 2, options: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"] },
  monk: { choose: 2, options: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
  paladin: { choose: 2, options: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"] },
  ranger: { choose: 3, options: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
  rogue: { choose: 4, options: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"] },
  sorcerer: { choose: 2, options: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
  warlock: { choose: 2, options: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
  wizard: { choose: 2, options: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"] },
};

const RACE_TRAITS = {
  dragonborn: ["Draconic Ancestry", "Breath Weapon", "Damage Resistance"],
  dwarf: ["Darkvision", "Dwarven Resilience", "Stonecunning", "Tool Proficiency"],
  elf: ["Darkvision", "Keen Senses", "Fey Ancestry", "Trance"],
  gnome: ["Darkvision", "Gnome Cunning"],
  "half-elf": ["Darkvision", "Fey Ancestry", "Skill Versatility"],
  "half-orc": ["Darkvision", "Relentless Endurance", "Savage Attacks"],
  halfling: ["Lucky", "Brave", "Halfling Nimbleness"],
  human: ["Extra Language", "Versatile Ability Scores"],
  tiefling: ["Darkvision", "Hellish Resistance", "Infernal Legacy"],
};

const STARTER_ATTACKS = {
  monk: [
    { name: "Shortsword", range: "5 feet", type: "Piercing", damage: "1d6" },
    { name: "Dart", range: "20/60", type: "Piercing", damage: "1d4" },
    { name: "Unarmed Strike", range: "5 feet", type: "Bludgeoning", damage: "1d4" },
  ],
  fighter: [
    { name: "Longsword", range: "5 feet", type: "Slashing", damage: "1d8" },
    { name: "Light Crossbow", range: "80/320", type: "Piercing", damage: "1d8" },
  ],
  rogue: [
    { name: "Rapier", range: "5 feet", type: "Piercing", damage: "1d8" },
    { name: "Shortbow", range: "80/320", type: "Piercing", damage: "1d6" },
  ],
};

const HALF_CASTER = new Set(["paladin", "ranger"]);
const CLASS_DECKS = {
  bard: "bard",
  cleric: "cleric",
  druid: "druid",
  paladin: "paladin",
  ranger: "ranger",
  warlock: "warlock",
  sorcerer: "arcane",
  wizard: "arcane",
};

const STEPS = [
  ["lineage", "Origem"],
  ["abilities", "Atributos"],
  ["choices", "Escolhas"],
  ["leveling", "Niveis"],
];

const TABS = [
  ["summary", "Base"],
  ["skills", "Skills"],
  ["attacks", "Ataques"],
  ["spells", "Magia"],
  ["inventory", "Inventory"],
  ["features", "Features"],
];

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
  api: { classes: {}, levels: {}, races: {}, spells: [], classSpells: {}, spellDetails: {}, source: {} },
  activeCharacterId: "default",
  characters: [],
  character: {
    name: "Cascarudo",
    class: "monk",
    level: 1,
    race: "Turtle",
    subrace: "Turtle",
    background: "Hermit",
    alignment: "Neutral",
    experience: 0,
    abilityMethod: "standard",
    classFeatureChoices: {},
    asiChoices: {},
    equipmentChoices: {},
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
  state.selectedSpell ||= state.character.spells[0] ?? "";
  bindGlobalEvents();
  render();
  await hydrateApiData();
  render();
}

function loadState() {
  const saved = localStorage.getItem("dnd-sheet-builder");
  if (!saved) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(defaultState);
  }
}

function persist() {
  syncActiveCharacter();
  const savedState = structuredClone(state);
  savedState.api = structuredClone(defaultState.api);
  savedState.derived = null;
  localStorage.setItem("dnd-sheet-builder", JSON.stringify(savedState));
}

function ensureRosterState() {
  state.character.id ??= state.activeCharacterId ?? crypto.randomUUID();
  state.character.subrace ??= defaultSubrace(state.character.race);
  state.characters = Array.isArray(state.characters) ? state.characters : [];
  if (!state.characters.length) state.characters = [structuredClone(state.character)];
  state.activeCharacterId ??= state.character.id;
  const active = state.characters.find((character) => character.id === state.activeCharacterId);
  if (active) state.character = structuredClone(active);
  else {
    state.activeCharacterId = state.characters[0].id;
    state.character = structuredClone(state.characters[0]);
  }
  state.creationComplete = Boolean(state.character.creationComplete ?? state.creationComplete);
  if (state.creationComplete && !state.levelUpMode) state.builderVisible = false;
}

function syncActiveCharacter() {
  state.character.id ??= state.activeCharacterId ?? crypto.randomUUID();
  state.character.creationComplete = Boolean(state.creationComplete || state.character.creationComplete);
  state.activeCharacterId = state.character.id;
  const index = state.characters.findIndex((character) => character.id === state.character.id);
  if (index >= 0) state.characters[index] = structuredClone(state.character);
  else state.characters.push(structuredClone(state.character));
}

function bindGlobalEvents() {
  els.saveButton.addEventListener("click", () => {
    persist();
    state.dataStatus = state.dataStatus.includes("API") ? "salvo + API" : "salvo local";
    renderChrome();
  });

  els.characterMenuButton.addEventListener("click", () => {
    toggleCharacterMenu();
  });

  els.menuBackdrop.addEventListener("click", () => {
    closeCharacterMenu();
  });

  els.hpModalBackdrop.addEventListener("click", closeHpModal);

document.getElementById("restModalBackdrop")?.addEventListener("click", () => {
  if (state.restModalOpen) cancelRest();
});

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.hpModalOpen) closeHpModal();
  if (event.key === "Escape" && state.restModalOpen) cancelRest();
  });
}

function createStartingCharacter() {
  const character = structuredClone(defaultState.character);
  character.id = crypto.randomUUID();
  character.name = "Nova Ficha";
  character.level = 1;
  character.abilityMethod = "standard";
  character.abilities = Object.fromEntries(ABILITIES.map(([key], index) => [key, STANDARD_ARRAY[index]]));
  character.classFeatureChoices = {};
  character.asiChoices = {};
  character.bgSpellChoices = {};
  character.equipmentChoices = {};
  character.inventory = [];
  character.equippedItems = [];
  character.hitDiceUsed = 0;
  character.spellSlots = {};
  character.resources = {};
  character.race = "human";
  character.subrace = "Human";
  character.class = "fighter";
  character.background = "Acolyte";
  character.hp = maxLevelOneHp(character.class, character.abilities);
  character.armorClass = 10 + Math.floor(((character.abilities.dex ?? 10) - 10) / 2);
  character.speed = 30;
  character.attacks = [];
  character.spells = [];
  character.notes = "";
  character.classSkillChoices = [];
  character.skillProficiencies = [];
  character.savingThrows = defaultSaves(character.class);
  return character;
}

function createNewCharacter() {
  syncActiveCharacter();
  const fresh = createStartingCharacter();
  state.character = fresh;
  state.activeCharacterId = fresh.id;
  state.characters.push(structuredClone(fresh));
  state.step = "lineage";
  state.selectedSpell = "";
  state.levelUpMode = false;
  state.creationComplete = false;
  state.builderVisible = true;
  state.character.bgSpellChoices = {};
  persist();
  render();
}

function switchCharacter(characterId) {
  syncActiveCharacter();
  const character = state.characters.find((item) => item.id === characterId);
  if (!character) return;
  state.activeCharacterId = character.id;
  state.character = structuredClone(character);
  state.selectedSpell = state.character.spells[0] ?? "";
  state.levelUpMode = false;
  state.creationComplete = Boolean(state.character.creationComplete);
  if (state.creationComplete) state.builderVisible = false;
  normalizeCharacterState();
  persist();
  render();
}

function deleteCharacter(characterId) {
  syncActiveCharacter();
  state.characters = state.characters.filter((character) => character.id !== characterId);
  if (!state.characters.length) {
    const fresh = createStartingCharacter();
    state.characters = [structuredClone(fresh)];
    state.character = fresh;
    state.activeCharacterId = fresh.id;
  } else if (state.activeCharacterId === characterId) {
    state.activeCharacterId = state.characters[0].id;
    state.character = structuredClone(state.characters[0]);
  }
  normalizeCharacterState();
  persist();
  render();
}

async function hydrateApiData() {
  state.dataStatus = "carregando 5etools 2024";
  renderChrome();
  try {
    const [classes, races, subraces, backgrounds, equipment, spells, classSpells, classFeatures, subclasses, feats] = await Promise.all([
      fetchJson(`${DATA_SOURCE}/classes.json`),
      fetchJson(`${DATA_SOURCE}/races.json`),
      fetchJson(`${DATA_SOURCE}/subraces.json`),
      fetchJson(`${DATA_SOURCE}/backgrounds.json`),
      fetchJson(`${DATA_SOURCE}/equipment.json`),
      fetchJson(`${DATA_SOURCE}/spells.json`),
      fetchJson(`${DATA_SOURCE}/class-spells.json`),
      fetchJson(`${DATA_SOURCE}/class-features.json`),
      fetchJson(`${DATA_SOURCE}/subclasses.json`),
      fetchJson(`${DATA_SOURCE}/feats.json`),
    ]);
    hydrate5etoolsSource({ classes, races, subraces, backgrounds, equipment, spells, classSpells, classFeatures, subclasses, feats });
    state.dataStatus = DATA_SOURCE_LABEL;
    normalizeCharacterState();
    persist();
  } catch {
    state.dataStatus = "erro 5etools 2024";
  }
}

async function loadClassData(className) {
  if (!className) return;
  await loadClassSpellOptions(className);
}

async function loadRaceData(raceName) {
  return raceName;
}

async function loadClassSpellOptions(className) {
  return className;
}

async function loadSpellDetails(spellName) {
  if (!spellName || state.api.spellDetails[spellName]) return;
  const detail = state.api.source?.spellDetails?.[spellName.toLowerCase()];
  if (detail) {
    state.api.spellDetails[spellName] = detail;
    persist();
  }
}

function hydrate5etoolsSource({ classes, races, subraces, backgrounds, equipment, spells, classSpells, classFeatures, subclasses, feats }) {
  const classResults = classes.results ?? [];
  const raceResults = races.results ?? [];
  const subraceResults = subraces.results ?? [];
  const backgroundResults = backgrounds.results ?? [];
  const equipmentResults = equipment.results ?? [];
  const spellResults = spells.results ?? [];
  const classSpellResults = classSpells.results ?? {};
  const classFeatureResults = classFeatures.results ?? [];
  const subclassResults = subclasses.results ?? [];
  const featResults = feats.results ?? [];
  const spellByKey = new Map(spellResults.map((spell) => [`${spell.name.toLowerCase()}|${spell.source.toLowerCase()}`, spell]));

  state.api = {
    classes: Object.fromEntries(classResults.map((klass) => [slugifyName(klass.name), normalize5etoolsClass(klass)])),
    levels: Object.fromEntries(classResults.map((klass) => [slugifyName(klass.name), build5etoolsLevels(klass)])),
    races: Object.fromEntries(raceResults.map((race) => [slugifyName(race.name), normalize5etoolsRace(race, subraceResults)])),
    spells: spellResults.map((spell) => spell.name),
    classSpells: Object.fromEntries(Object.values(classSpellResults).map((list) => {
      const classKey = slugifyName(list.className);
      const options = (list.spells ?? [])
        .map((ref) => spellByKey.get(`${ref.name.toLowerCase()}|${ref.source.toLowerCase()}`))
        .filter(Boolean)
        .map((spell) => ({ name: spell.name, level: spell.level, source: spell.source }))
        .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
      return [classKey, options];
    })),
    spellDetails: {},
    source: {
      classOptions: classResults.map((klass) => [slugifyName(klass.name), klass.name]).sort((a, b) => a[1].localeCompare(b[1])),
      raceOptions: raceResults.map((race) => [slugifyName(race.name), race.name]).sort((a, b) => a[1].localeCompare(b[1])),
      backgroundOptions: backgroundResults.map((background) => [background.name, background.name]).sort((a, b) => a[1].localeCompare(b[1])),
      backgroundDetails: Object.fromEntries(backgroundResults.map((background) => [background.name.toLowerCase(), background])),
      subraceDetails: Object.fromEntries(subraceResults.map((subrace) => [slugifyName(subrace.name), subrace])),
      itemDetails: Object.fromEntries(equipmentResults.map((item) => [itemKey(item.name, item.source), item])),
      classFeatures: classFeatureResults.map(normalize5etoolsFeature),
      subclasses: subclassResults,
      featDetails: Object.fromEntries(featResults.map((feat) => [slugifyName(feat.name), normalize5etoolsFeature({ ...feat, type: "feat" })])),
      spellDetails: Object.fromEntries(spellResults.map((spell) => [spell.name.toLowerCase(), normalize5etoolsSpell(spell)])),
    },
  };
  ruleRepository = RuleRepository.fromApi(state.api);
}

function normalize5etoolsFeature(feature) {
  return {
    name: feature.name,
    source: feature.source,
    className: feature.className,
    classSource: feature.classSource,
    level: feature.level,
    category: feature.category,
    ability: feature.ability,
    prerequisite: feature.prerequisite,
    type: feature.type ?? "feature",
    entries: feature.entries,
    body: entriesToText(feature.entries),
  };
}

function normalize5etoolsClass(klass) {
  return {
    name: klass.name,
    index: slugifyName(klass.name),
    source: klass.source,
    hit_die: Number(String(klass.hitDie).replace(/\D/g, "")) || 8,
    proficiency: klass.proficiency ?? [],
    saving_throws: (klass.proficiency ?? []).map((save) => ({ index: save })),
    spellcastingAbility: klass.spellcastingAbility,
    casterProgression: klass.casterProgression,
    cantripProgression: klass.cantripProgression ?? [],
    preparedSpellsProgression: klass.preparedSpellsProgression ?? [],
    startingProficiencies: klass.startingProficiencies ?? {},
    classTableGroups: klass.classTableGroups ?? [],
  };
}

function build5etoolsLevels(klass) {
  const slotRows = (klass.classTableGroups ?? []).find((group) => Array.isArray(group.rowsSpellProgression))?.rowsSpellProgression ?? [];
  const preparedRows = klass.preparedSpellsProgression ?? [];
  const cantripRows = klass.cantripProgression ?? [];
  return Array.from({ length: 20 }, (_, index) => {
    const slots = slotRows[index] ?? [];
    const spellcasting = {
      cantrips_known: cantripRows[index] ?? 0,
      prepared_spells: preparedRows[index] ?? 0,
    };
    slots.forEach((count, slotIndex) => {
      spellcasting[`spell_slots_level_${slotIndex + 1}`] = count;
    });
    return {
      level: index + 1,
      prof_bonus: proficiencyForLevel(index + 1),
      features: [],
      spellcasting,
    };
  });
}

function normalize5etoolsRace(race, subraceResults) {
  const explicitSubraces = subraceResults
    .filter((subrace) => slugifyName(subrace.raceName) === slugifyName(race.name))
    .map((subrace) => subrace.name)
    .filter(Boolean);
  const ancestryOptions = inferAncestryOptionsFromEntries(race.entries);
  return {
    details: race,
    subraces: explicitSubraces.length ? explicitSubraces : ancestryOptions,
  };
}

function normalize5etoolsSpell(spell) {
  const levelLine = spell.level === 0
    ? `${spellSchoolName(spell.school)} cantrip`.trim()
    : `${spell.level}${ordinalSuffix(spell.level)}-level ${spellSchoolName(spell.school)}`.trim();
  return {
    name: spell.name,
    level: spell.level,
    levelLine,
    castingTime: format5etoolsTime(spell.time),
    range: format5etoolsRange(spell.range),
    components: format5etoolsComponents(spell.components),
    duration: format5etoolsDuration(spell.duration),
    material: typeof spell.components?.m === "string" ? clean5etoolsText(spell.components.m) : "",
    description: entriesToText(spell.entries),
    higherLevel: entriesToText(spell.entriesHigherLevel),
  };
}

function inferAncestryOptionsFromEntries(entries) {
  const names = [];
  const choiceNamePattern = /(lineage|ancestor|ancestry|legacy|legacies|heritage)/i;
  walkEntries(entries, (item) => {
    if (item?.type === "table" && Array.isArray(item.rows)) {
      const caption = String(item.caption ?? "");
      if (!choiceNamePattern.test(caption)) return;
      item.rows.forEach((row) => {
        if (typeof row?.[0] === "string") names.push(row[0]);
      });
    }
    if (item?.type === "entries" && choiceNamePattern.test(item.name ?? "")) {
      walkEntries(item.entries, (child) => {
        if (child?.type === "item" && child.name) names.push(child.name);
      });
    }
  });
  return [...new Set(names)];
}

function walkEntries(value, visitor) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkEntries(item, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;
  visitor(value);
  Object.values(value).forEach((item) => walkEntries(item, visitor));
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function render() {
  renderChrome();
  renderCharacterMenu();
  if (state.builderVisible !== false) {
    renderSteps();
    renderForm();
  }
  renderTabs();
  renderSheet();
  renderHpModal();

 renderRestModal();
}

function renderChrome() {
  els.app.classList.toggle("sheet-only", state.builderVisible === false);
  els.topbarName.textContent = state.character.name || "Nova Ficha";
  els.syncState.textContent = state.dataStatus;
}

function renderCharacterMenu() {
  els.characterMenu.innerHTML = `
    <div class="character-menu-head">
      <div>
        <p class="eyebrow">Fichas</p>
        <h2>${escapeHtml(state.character.name || "Nova Ficha")}</h2>
      </div>
      <button type="button" class="icon-button" data-close-menu aria-label="Fechar menu">x</button>
    </div>
    <div class="menu-actions">
      <button type="button" class="primary-button" data-menu-new>Nova ficha</button>
      <button type="button" class="secondary-button" data-menu-level-up ${state.character.level >= 20 ? "disabled" : ""}>Subir nivel</button>
      ${state.builderVisible === false ? `<button type="button" class="secondary-button" data-menu-toggle-builder>Mostrar criador</button>` : ""}
      <button type="button" class="danger-button" data-menu-delete-active>Excluir ficha</button>
    </div>
    <div class="menu-current">
      <span>Nivel ${state.character.level}</span>
      <strong>${titleCase(state.character.subrace || state.character.race)} ${titleCase(state.character.class)}</strong>
    </div>
    <div class="roster-list menu-roster">
      ${state.characters.map((character) => `
        <button type="button" class="roster-button ${character.id === state.activeCharacterId ? "active" : ""}" data-menu-roster-id="${character.id}">
          <span class="roster-main"><strong>${escapeHtml(character.name || "Nova Ficha")}</strong><span>${titleCase(character.subrace || character.race)} ${titleCase(character.class)} ${character.level}</span></span>
          <span class="delete-character" data-menu-delete-id="${character.id}" aria-label="Excluir ficha">x</span>
        </button>
      `).join("")}
    </div>
  `;
  bindCharacterMenuEvents();
}

function bindCharacterMenuEvents() {
  els.characterMenu.querySelector("[data-close-menu]")?.addEventListener("click", closeCharacterMenu);
  els.characterMenu.querySelector("[data-menu-new]")?.addEventListener("click", () => {
    createNewCharacter();
    closeCharacterMenu();
  });
  els.characterMenu.querySelector("[data-menu-level-up]")?.addEventListener("click", () => {
    startLevelUpAssistant();
    persist();
    render();
    closeCharacterMenu();
  });
  els.characterMenu.querySelector("[data-menu-toggle-builder]")?.addEventListener("click", () => {
    state.builderVisible = state.builderVisible === false;
    persist();
    render();
    closeCharacterMenu();
  });
  els.characterMenu.querySelector("[data-menu-delete-active]")?.addEventListener("click", () => {
    deleteCharacter(state.activeCharacterId);
    closeCharacterMenu();
  });
  els.characterMenu.querySelectorAll("[data-menu-roster-id]").forEach((button) => {
    button.addEventListener("click", () => {
      switchCharacter(button.dataset.menuRosterId);
      closeCharacterMenu();
    });
  });
  els.characterMenu.querySelectorAll("[data-menu-delete-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteCharacter(button.dataset.menuDeleteId);
      closeCharacterMenu();
    });
  });
}

function toggleCharacterMenu() {
  const willOpen = els.characterMenu.hidden;
  els.characterMenu.hidden = !willOpen;
  els.menuBackdrop.hidden = !willOpen;
  els.characterMenuButton.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) renderCharacterMenu();
}

function closeCharacterMenu() {
  els.characterMenu.hidden = true;
  els.menuBackdrop.hidden = true;
  els.characterMenuButton.setAttribute("aria-expanded", "false");
}

function renderSteps() {
  if (state.levelUpMode) {
    els.stepNav.innerHTML = `<button type="button" class="step-button active" data-step="leveling">Subir nivel</button>`;
    return;
  }
  els.stepNav.innerHTML = STEPS.map(([id, label]) => (
    `<button type="button" class="step-button ${state.step === id ? "active" : ""}" data-step="${id}">${label}</button>`
  )).join("");
  els.stepNav.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const currentIndex = STEPS.findIndex(([id]) => id === state.step);
      const nextIndex = STEPS.findIndex(([id]) => id === button.dataset.step);
      if (nextIndex > currentIndex && !validateStepRange(currentIndex, nextIndex)) {
        persist();
        render();
        return;
      }
      state.validationMessage = "";
      state.step = button.dataset.step;
      persist();
      render();
    });
  });
}

function renderTabs() {
  els.sheetTabs.innerHTML = TABS.map(([id, label]) => (
    `<button type="button" class="tab-button ${state.tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`
  )).join("");
  els.sheetTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      persist();
      renderSheet();
      renderTabs();
    });
  });
}

function renderForm() {
  if (state.levelUpMode) {
    state.step = "leveling";
    els.form.innerHTML = renderLevelingForm();
    bindFormEvents();
    return;
  }
  const renderers = {
    lineage: renderLineageForm,
    abilities: renderAbilitiesForm,
    choices: renderChoicesForm,
    leveling: renderLevelingForm,
  };
  els.form.innerHTML = `${state.step === "lineage" ? renderNameField() : ""}${renderers[state.step]()}`;
  bindFormEvents();
}

function renderNameField() {
  const c = state.character;
  return `
    <section class="character-name-panel">
      ${field("name", "Nome da ficha", c.name)}
    </section>
  `;
}

function renderLineageForm() {
  const c = state.character;
  const locked = creationChoicesLocked();
  const subraceOptions = subracesFor(c.race);
  const classOptions = state.api.source?.classOptions?.length ? state.api.source.classOptions : CLASSES.map((item) => [item, titleCase(item)]);
  const raceOptions = state.api.source?.raceOptions?.length ? state.api.source.raceOptions : RACES.map((item) => [item, titleCase(item)]);
  const backgroundOptions = state.api.source?.backgroundOptions?.length ? state.api.source.backgroundOptions : BACKGROUNDS.map((item) => [item, item]);
  const hasSubrace = subraceOptions.length > 0; const subraceFieldOptions = hasSubrace ? subraceOptions.map((item) => [item, item]) : [["", ""]];
  return `
    <div class="form-grid">
      ${selectField("class", "Classe", c.class, classOptions, locked)}
      ${selectField("race", "Raca / especie", c.race, raceOptions, locked)}
      ${hasSubrace ? selectField("subrace", "Subraca", c.subrace ?? "", subraceFieldOptions, locked) : ""}
      ${selectField("background", "Background", c.background, backgroundOptions, locked)}
      ${selectField("alignment", "Alinhamento", c.alignment, ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"].map((item) => [item, item]), locked)}
    </div>
    <p class="hint">${locked ? "Origem, classe e background foram definidos na criacao e ficam travados depois que a ficha e finalizada." : "Classe, especie, background, magias e progresso por nivel vem exclusivamente dos dados 5etools 2024."}</p>
    ${navButtons()}
  `;
}

function renderAbilitiesForm() {
  const locked = creationChoicesLocked();
  const classSaves = classSavingThrows();
  return `
    <fieldset class="choice-group ability-method-panel">
      <legend>Ability Scores</legend>
      ${locked ? `<p class="hint">Atributos de criacao ficam travados depois que a ficha e finalizada.</p>` : selectField("abilityMethod", "Metodo de geracao", state.character.abilityMethod ?? "standard", ABILITY_METHODS)}
      ${locked ? "" : renderAbilityMethodControls()}
    </fieldset>
    ${renderAbilityScoreCalculations()}
    <fieldset class="choice-group">
      <legend>Saving throws da classe</legend>
      <p class="choice-counter complete">${classSaves.length}/${classSaves.length} fixos por ${titleCase(state.character.class)}</p>
      <p class="hint">Saving throw proficiency vem da classe inicial. Trocar a classe atualiza estes dois saves automaticamente.</p>
      <div class="choice-list">
        ${ABILITIES.map(([key, label]) => checkbox("savingThrows", key, label, classSaves.includes(key), !classSaves.includes(key), true)).join("")}
      </div>
    </fieldset>
    ${navButtons()}
  `;
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
  return `
    <div class="standard-array-grid">
      ${ABILITIES.map(([key, label]) => standardArrayCard(key, label)).join("")}
    </div>
    <p class="hint">Arraste um atributo sobre outro para trocar os valores entre eles.</p>
  `;
}

function standardArrayCard(key, label) {
  return `
    <button type="button" class="standard-array-card" draggable="true" data-standard-ability="${key}">
      <span>${label}</span>
      <strong>${state.character.abilities[key]}</strong>
      <em>${signed(mod(key))}</em>
    </button>
  `;
}

function renderPointBuyControls() {
  const spent = pointBuySpent();
  const remaining = POINT_BUY_BUDGET - spent;
  return `
    <div class="point-buy-head">
      <strong>${remaining} pontos restantes</strong>
      <span>${spent}/${POINT_BUY_BUDGET} gastos</span>
    </div>
    <div class="point-buy-grid">
      ${ABILITIES.map(([key, label]) => pointBuyRow(key, label, remaining)).join("")}
    </div>
    <p class="hint">Point Buy usa valores de 8 a 15 antes dos bonus de especie/background. Aumentar de 13 para 14 ou 15 custa mais.</p>
  `;
}

function pointBuyRow(key, label, remaining) {
  const score = Number(state.character.abilities[key]) || 8;
  const nextCost = pointBuyCost(score + 1) - pointBuyCost(score);
  const canIncrease = score < 15 && remaining >= nextCost;
  return `
    <article class="point-buy-row">
      <div>
        <strong>${label}</strong>
        <span>Custo ${pointBuyCost(score)} | Mod ${signed(mod(key))}</span>
      </div>
      <div class="score-stepper">
        <button type="button" class="mini-button" data-ability-adjust="${key}" data-delta="-1" ${score <= 8 ? "disabled" : ""}>-</button>
        <output>${score}</output>
        <button type="button" class="mini-button" data-ability-adjust="${key}" data-delta="1" ${canIncrease ? "" : "disabled"}>+</button>
      </div>
    </article>
  `;
}

function renderAbilityScoreCalculations() {
  return `
    <section class="score-calculations">
      <h3>Score Calculations</h3>
      <div class="score-card-grid">
        ${ABILITIES.map(([key, label]) => scoreCalculationCard(key, label)).join("")}
      </div>
    </section>
  `;
}

function scoreCalculationCard(key, label) {
  const score = Number(state.character.abilities[key]) || 10;
  const bonus = abilityBonusFromChoices(key);
  return `
    <article class="score-calc-card">
      <h4>${label}</h4>
      <div><span>Total Score</span><strong>${abilityScore(key)}</strong></div>
      <div><span>Modifier</span><strong>${signed(mod(key))}</strong></div>
      <div><span>Base Score</span><strong>${score}</strong></div>
      <div><span>Bonus</span><strong>${signed(bonus)}</strong></div>
    </article>
  `;
}

function renderChoicesForm() {
  const classSkill = classSkillRule();
  const backgroundSkills = backgroundSkillProficiencies();
  const selected = state.character.classSkillChoices ?? [];
  const selectedCount = selected.length;
  const skillOptions = [...new Set([...backgroundSkills, ...classSkill.options])];
  const classChoices = classCreationChoiceRules();
const bgSpellChoices = backgroundSpellChoiceRules();
  const locked = creationChoicesLocked();
  return `
    <fieldset class="choice-group">
      <legend>Skills</legend>
      <p class="choice-counter ${selectedCount === classSkill.choose ? "complete" : selectedCount > classSkill.choose ? "invalid" : ""}">
        ${selectedCount}/${classSkill.choose} escolhas da classe${backgroundSkills.length ? ` • ${backgroundSkills.length} do background` : ""}
      </p>
      <div class="choice-list">
        ${skillOptions.map((name) => {
          const fromBackground = backgroundSkills.includes(name);
          const isClassOption = classSkill.options.includes(name);
          const isSelected = selected.includes(name);
          return checkbox(
            "classSkillChoices",
            name,
            `${escapeHtml(name)}${fromBackground ? " <small class=\"choice-source\">Background</small>" : ""}`,
            isSelected || fromBackground,
            !isClassOption || (selectedCount >= classSkill.choose && !isSelected),
            locked || fromBackground
          );
        }).join("")}
      </div>
    </fieldset>
    ${classChoices.map(renderClassCreationChoice).join("")} ${bgSpellChoices.map(renderBgSpellChoice).join("")}
    ${equipmentChoiceRules().map(renderEquipmentChoice).join("")}
    <fieldset class="choice-group">
      <legend>Ataques</legend>
      <div id="attackEditor">
        ${state.character.attacks.map((attack, index) => attackEditorRow(attack, index)).join("") || `<p class="hint">Nenhum ataque cadastrado.</p>`}
      </div>
      <button type="button" class="mini-button" id="addAttackButton">New</button>
      <button type="button" class="mini-button" id="suggestAttacksButton">Sugerir da classe</button>
    </fieldset>
    ${navButtons()}
  `;
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

function renderLevelingForm() {
  const spellRule = spellChoiceRule();
  const spellCounts = selectedSpellCounts();
  const spellComplete = spellCounts.cantrips === spellRule.cantrips && spellCounts.leveled === spellRule.spellsMax;
  const spellInvalid = spellCounts.cantrips > spellRule.cantrips || spellCounts.leveled > spellRule.spellsMax;
  const classChoices = levelScopedChoiceRules();
  return `
    ${state.levelUpMode ? `
      <section class="level-up-banner">
        <strong>Level up: ${state.levelUpFrom} → ${state.character.level}</strong>
        <span>Este fluxo mostra apenas o que pode mudar neste nivel.</span>
      </section>
      ${renderLevelUpClassChoice()}
      ${renderLevelUpHpControl()}
    ` : ""}
    ${classChoices.length ? classChoices.map(renderClassCreationChoice).join("") : ""}
    <fieldset class="choice-group">
      <legend>Magias conhecidas / preparadas</legend>
      <p class="choice-counter ${spellComplete ? "complete" : spellInvalid ? "invalid" : ""}">
        Cantrips ${spellCounts.cantrips}/${spellRule.cantrips} | Magias ${spellCounts.leveled}/${spellRule.spellsMax}
      </p>
      <p class="hint">${spellRule.hint}</p>
      ${renderSpellChoiceGroups(spellRule, spellCounts)}
    </fieldset>
    ${state.levelUpMode ? levelUpNavButtons() : navButtons()}
  `;
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
  const con = mod("con");
  const die = hitDie();
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

function field(path, label, value) {
  const id = path.replace(".", "-");
  return `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-path="${path}" value="${escapeHtml(value)}" /></div>`;
}

function numberField(path, label, value, min, max) {
  const id = path.replace(".", "-");
  return `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-path="${path}" type="number" min="${min}" max="${max}" value="${value}" /></div>`;
}

function selectField(path, label, value, options, disabled = false) {
  const id = path.replace(".", "-");
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <select id="${id}" data-path="${path}" ${disabled ? "disabled" : ""}>
        ${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${String(optionValue).toLowerCase() === String(value).toLowerCase() ? "selected" : ""}>${optionLabel}</option>`).join("")}
      </select>
    </div>
  `;
}

function checkbox(path, value, label, checked, disabled = false, locked = false) {
  return `<label class="${disabled ? "disabled" : ""} ${locked ? "locked" : ""}"><input type="checkbox" data-list="${path}" value="${escapeHtml(value)}" ${checked ? "checked" : ""} ${disabled || locked ? "disabled" : ""} /><span class="checkbox-label">${label}</span></label>`;
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
  const missing = missingChoicesForStep(step);
  if (missing.length) {
    state.validationMessage = `Ainda falta: ${missing.join(", ")}.`;
    return false;
  }
  state.validationMessage = "";
  return true;
}

function missingChoicesForStep(step) {
  if (step === "lineage") {
    const missing = [];
    if (!state.character.name?.trim()) missing.push("nome da ficha");
    if (!state.character.class) missing.push("classe");
    if (!state.character.race) missing.push("raca/especie");
    if (subracesFor(state.character.race).length && !state.character.subrace) missing.push("subraca/linhagem");
    if (!state.character.background) missing.push("background");
    return missing;
  }

  if (step === "abilities") {
    const missing = ABILITIES.filter(([key]) => !Number.isFinite(Number(state.character.abilities[key]))).map(([, label]) => label);
    if ((state.character.abilityMethod ?? "standard") === "pointBuy" && pointBuySpent() !== POINT_BUY_BUDGET) {
      missing.push(`${POINT_BUY_BUDGET - pointBuySpent()} pontos de Point Buy`);
    }
    return missing;
  }

  if (step === "choices") return missingCreationChoices();
  if (step === "leveling") return [...missingLevelUpChoices(), ...missingCreationChoices(), ...missingSpellChoices()];
  return [];
}

function missingCreationChoices() {
  if (!state.levelUpMode && creationChoicesLocked()) return [];
  const missing = [];
  const skillRule = classSkillRule();
  if (!state.levelUpMode && !state.creationComplete && (state.character.classSkillChoices ?? []).length !== skillRule.choose) missing.push(`${skillRule.choose} skill(s) da classe`);
  activeChoiceRulesForValidation().forEach((rule) => {
    if (rule.type === "asi") {
      if (!isAsiChoiceComplete(rule)) missing.push(rule.name);
      return;
    }
    if (!state.character.classFeatureChoices?.[rule.id]) missing.push(rule.name);
  });
  // Check background spell choices (Magic Initiate)
const bgSpellRules = backgroundSpellChoiceRules();
bgSpellRules.forEach((rule) => {
  const storageKey = `bg-${rule.id}`;
  const selected = state.character.bgSpellChoices?.[storageKey] || [];
  const selectedCantrips = selected.filter(s => s && state.api.source?.spellDetails?.[s.toLowerCase()]?.level === 0);
  const selectedLevel1 = selected.filter(s => s && state.api.source?.spellDetails?.[s.toLowerCase()]?.level === 1);
  if (selectedCantrips.length < (rule.cantrips || 2)) missing.push(`${rule.name}: ${rule.cantrips} cantrips`);
  if (selectedLevel1.length < (rule.level1Spells || 1)) missing.push(`${rule.name}: ${rule.level1Spells} level 1 spell`);
});

if (!state.levelUpMode && !state.creationComplete) equipmentChoiceRules().forEach((rule) => {
    if (!state.character.equipmentChoices?.[rule.id]) missing.push(rule.name);
  });
  return missing;
}

function missingSpellChoices() {
  const rule = spellChoiceRule();
  if (rule.totalMax === 0) return [];
  const counts = selectedSpellCounts();
  const missing = [];
  if (counts.cantrips !== rule.cantrips) missing.push(`${rule.cantrips} cantrip(s)`);
  if (counts.leveled !== rule.spellsMax) missing.push(`${rule.spellsMax} magia(s) de nivel 1+`);
  return missing;
}

function missingLevelUpChoices() {
  if (!state.levelUpMode) return [];
  return state.levelUpHpGain ? [] : ["ganho de HP do nivel"];
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
      setByPath(state.character, input.dataset.path, input.type === "number" ? Number(input.value) : input.value);
      const needsFullRender = input.dataset.path === "class" || input.dataset.path === "race" || input.dataset.path === "subrace" || input.dataset.path === "background" || input.dataset.path === "abilityMethod" || input.dataset.path.startsWith("abilities.") || input.dataset.path.startsWith("asiChoices.");
      if (input.dataset.path === "class") {
        await loadClassData(input.value);
        state.character.savingThrows = defaultSaves(input.value);
        state.character.classSkillChoices = [];
        state.character.classFeatureChoices = {};
        state.character.asiChoices = {};
  character.bgSpellChoices = {};
        state.character.equipmentChoices = {};
        state.character.inventory = [];
        state.character.equippedItems = [];
        if (state.character.level === 1) state.character.hp = maxLevelOneHp(input.value, state.character.abilities);
      }
      if (input.dataset.path.startsWith("abilities.") && state.character.level === 1) {
        state.character.hp = maxLevelOneHp(state.character.class, state.character.abilities);
      }
      if (input.dataset.path === "abilityMethod") {
        applyAbilityMethod(input.value);
      }
      if (input.dataset.path === "race") {
        await loadRaceData(input.value);
        state.character.subrace = defaultSubrace(input.value);
      }
      if (input.dataset.path === "background") {
        const backgroundSkills = backgroundSkillProficiencies(input.value);
        state.character.classSkillChoices = (state.character.classSkillChoices ?? []).filter((skill) => !backgroundSkills.includes(skill));
        state.character.equipmentChoices = {};
        state.character.inventory = [];
        state.character.equippedItems = [];
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
  const fromValue = state.character.abilities[from];
  state.character.abilities[from] = state.character.abilities[to];
  state.character.abilities[to] = fromValue;
  normalizeCharacterState();
  persist();
  render();
}

function renderSheet() {
  const renderers = {
    summary: renderSummarySheet,
    skills: renderSkillsSheet,
    attacks: renderAttacksSheet,
    spells: renderSpellsSheet,
    inventory: renderInventorySheet,
    features: renderFeaturesSheet,
  };
  els.sheetView.innerHTML = renderers[state.tab]();
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
  if (!els.hpModal || !els.hpModalBackdrop) return;
  els.hpModal.hidden = !state.hpModalOpen;
  els.hpModalBackdrop.hidden = !state.hpModalOpen;
  if (!state.hpModalOpen) {
    els.hpModal.innerHTML = "";
    return;
  }
  const maxHp = maxHitPoints();
  const currentHp = Number(state.character.hp) || 0;
  const tempHp = Math.max(0, Number(state.character.tempHp) || 0);
  const totalHp = currentHp + tempHp;
  els.hpModal.innerHTML = `
    <div class="hp-modal-panel">
      <div class="hp-modal-head">
        <div>
          <p class="eyebrow">HP Control</p>
          <h2>Gerenciar vida</h2>
        </div>
        <button type="button" class="icon-button" data-close-hp-modal aria-label="Fechar controle de HP">x</button>
      </div>
      <div class="hp-control-panel">
        <div class="hp-display-shell">
          <button type="button" class="hp-action-button hp-heal ${state.hpModalMode === "heal" ? "active" : ""}" data-hp-mode="heal">HEAL</button>
          <label class="hp-quantity-stack">
            <span>QUANTITY</span>
            <input type="number" min="0" step="1" value="${Number(state.hpModalAmount) || 0}" data-hp-amount />
          </label>
          <button type="button" class="hp-action-button hp-damage ${state.hpModalMode === "damage" ? "active" : ""}" data-hp-mode="damage">DAMAGE</button>
        </div>
        <div class="hp-display-grid">
          <div class="hp-display-cell hp-current-cell">
            <span>CURRENT</span>
            <strong>${totalHp}</strong>
          </div>
          <div class="hp-display-divider">/</div>
          <div class="hp-display-cell hp-max-cell">
            <span>MAX</span>
            <strong>${maxHp}</strong>
          </div>
        </div>
        <div class="hp-temp-strip">
          <div class="hp-temp-readout">
            <span>TEMPORARY HP</span>
            <strong>${tempHp > 0 ? tempHp : 0}</strong>
          </div>
          <label class="hp-temp-stack">
            <span>THP AMOUNT</span>
            <input type="number" min="0" step="1" value="${Number(state.hpModalTempAmount) || 0}" data-hp-temp-amount />
          </label>
          <button type="button" class="hp-temp-button ${state.hpModalMode === "temp" ? "active" : ""}" data-hp-mode="temp">GAIN THP</button>
        </div>
      </div>
    </div>
  `;

  els.hpModal.querySelectorAll("[data-close-hp-modal]").forEach((button) => {
    button.addEventListener("click", closeHpModal);
  });
  els.hpModal.querySelectorAll("[data-hp-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.hpModalMode = button.dataset.hpMode;
      applyHpModalAction();
    });
  });
  els.hpModal.querySelector("[data-hp-amount]")?.addEventListener("input", (event) => {
    state.hpModalAmount = Math.max(0, Math.floor(Number(event.target.value) || 0));
  });
  els.hpModal.querySelector("[data-hp-temp-amount]")?.addEventListener("input", (event) => {
    state.hpModalTempAmount = Math.max(0, Math.floor(Number(event.target.value) || 0));
  });
}


function renderRestModal() {
  const modal = document.getElementById("restModal");
  const backdrop = document.getElementById("restModalBackdrop");
  if (!modal || !backdrop) return;

  if (!state.restModalOpen) {
    modal.hidden = true;
    backdrop.hidden = true;
    modal.innerHTML = "";
    return;
  }

  modal.hidden = false;
  backdrop.hidden = false;

  const content = state.restModalContent || { label: "Rest", description: "" };
  const isShortRest = state.restModalType === "short";
  const className = state.character.class || "fighter";
  const hitDie = state.api.classes?.[className]?.hit_die || 8;
  const level = state.character.level || 1;
  const conMod = mod("con");
  const hpPerDie = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod);
  state.restModalHitDice ??= {};

  let hitDiceHtml = '';
  if (isShortRest) {
    const checkboxes = [];
    for (let i = 0; i < level; i++) {
      const key = 'hd-' + i;
      const spent = i < (Number(state.character.hitDiceUsed) || 0);
      const isChecked = state.restModalHitDice?.[key]?.value ? 'checked' : '';
      checkboxes.push('<label class="hit-die-checkbox ' + (spent ? 'disabled' : '') + '"><input type="checkbox" data-hit-dice="' + key + '" ' + isChecked + ' ' + (spent ? 'disabled' : '') + ' />d' + hitDie + ' (' + hpPerDie + ' HP)</label>');
    }
    const available = availableHitDice();
    hitDiceHtml = '<div class="hit-dice-section"><p class="hit-dice-label">Gastar Hit Dice (' + available + '/' + level + ' disponiveis)</p><div class="hit-dice-controls">' + checkboxes.join('') + '</div></div>';
  }

  modal.innerHTML = '<div class="hp-modal-panel"><div class="hp-modal-head"><div><p class="eyebrow">' + content.label + '</p><h2>Confirmar</h2></div><button type="button" class="icon-button" id="restCloseBtn">x</button></div><div class="hp-control-panel">' + hitDiceHtml + '<div class="rest-actions"><button type="button" class="secondary-button" id="restCancelBtn">Cancelar</button><button type="button" class="primary-button" id="restConfirmBtn">Confirmar</button></div></div></div>';

  // Bind buttons
  const closeBtn = document.getElementById("restCloseBtn");
  const cancelBtn = document.getElementById("restCancelBtn");
  const confirmBtn = document.getElementById("restConfirmBtn");

  if (closeBtn) closeBtn.onclick = () => { cancelRest(); };
  if (cancelBtn) cancelBtn.onclick = () => { cancelRest(); };
  if (confirmBtn) confirmBtn.onclick = () => { confirmRest(); };

  // Bind Hit Dice
  if (isShortRest) {
    document.querySelectorAll("[data-hit-dice]").forEach(cb => {
      cb.onchange = (e) => {
        const key = e.target.dataset.hitDice;
        state.restModalHitDice ??= {};
        state.restModalHitDice[key] = { value: e.target.checked ? 1 : 0 };
      };
    });
  }
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

function renderSummarySheet() {
  const c = state.character;
  const maxHp = maxHitPoints();
  const currentHp = Number(c.hp) || 0;
  const tempHp = Math.max(0, Number(c.tempHp) || 0);
  const totalHp = currentHp + tempHp;
  const hitDiceAvailable = availableHitDice();
  return `
    <div class="pill-row">
      <div class="cream-pill">${escapeHtml(c.name)}</div>
      <div class="cream-pill">${titleCase(c.class)} ${c.level}</div>
    </div>
    <div class="hero-stats">
      ${bigStat("Initiative", signed(mod("dex")))}
      <button type="button" class="hp-orb" data-open-hp-modal aria-label="Controle de pontos de vida">
        <span>HP</span>
        <strong>${totalHp}<small>${currentHp}/${maxHp}</small></strong>
        <em>${tempHp > 0 ? `+${tempHp} THP` : "0 THP"}</em>
      </button>
      ${bigStat("Speed", c.speed)}
    </div>
    <div class="small-grid">
      ${smallStat("Hit Dice", `${hitDiceAvailable}/${c.level}d${hitDie()}`)}
      ${smallStat("Armor Class", c.armorClass)}
      ${smallStat("Proficiency", signed(proficiency()))}
    </div>
    <div class="rest-actions">
      <button type="button" class="secondary-button" data-rest-type="short">Short Rest</button>
      <button type="button" class="primary-button" data-rest-type="long">Long Rest</button>
    </div>
    <div class="abilities">
      ${ABILITIES.map(([key, label]) => abilityCard(key, label)).join("")}
    </div>
  `;
}

function renderSkillsSheet() {
  const grouped = ABILITIES.map(([key, label]) => [key, label, SKILLS.filter(([, ability]) => ability === key)]);
  return `<div class="skill-columns">${grouped.map(([key, label, skills]) => `
    <article class="skill-card">
      <h3><span>${label}</span><span>${signed(mod(key))}</span></h3>
      ${skills.map(([name]) => `<div class="skill-row"><span>${name}</span><strong>${signed(skillBonus(name))}</strong></div>`).join("")}
    </article>
  `).join("")}</div>`;
}

function renderAttacksSheet() {
  const filter = state.actionFilter ?? "all";
  const actions = currentActionItems();
  const filtered = filter === "all" ? actions : actions.filter((action) => action.kind === filter);
  const filters = [
    ["all", "All"],
    ["attack", "Attack"],
    ["action", "Action"],
    ["bonus", "Bonus Action"],
    ["reaction", "Reaction"],
    ["other", "Other"],
    ["limited", "Limited Use"],
  ];
  return `
    <div class="action-filter-row">
      ${filters.map(([id, label]) => `<button type="button" class="action-filter ${filter === id ? "active" : ""}" data-action-filter="${id}">${label}</button>`).join("")}
    </div>
    ${filter === "all" ? renderActionSections(actions) : renderActionSection(actionFilterTitle(filter), filtered, filter)}
  `;
}

function renderActionSections(actions) {
  return ["attack", "action", "bonus", "reaction", "other", "limited"]
    .map((kind) => renderActionSection(actionFilterTitle(kind), actions.filter((action) => action.kind === kind), kind))
    .join("");
}

function renderActionSection(title, actions, kind) {
  if (!actions.length) return "";
  return `
    <div class="actions-heading"><strong>${escapeHtml(title)}</strong>${kind === "attack" ? `<span>Attacks per Action: 1</span>` : ""}</div>
    <div class="actions-table">
      <div class="actions-table-head">
        <span>Attack</span><span>Range</span><span>Hit / DC</span><span>Damage</span><span>Notes</span>
      </div>
      ${actions.map(renderActionRow).join("")}
    </div>
  `;
}

function renderActionRow(action) {
  const open = state.selectedAction === action.id;
  return `
    <article class="action-entry">
      <button type="button" class="action-row ${open ? "active" : ""} ${action.disabled ? "disabled" : ""}" data-action-id="${escapeHtml(action.id)}" aria-disabled="${action.disabled ? "true" : "false"}">
        <span class="action-icon" aria-hidden="true">${escapeHtml(action.icon)}</span>
        <span class="action-name">
          <strong>${escapeHtml(action.name)}</strong>
          <span>${escapeHtml(action.subtitle)}</span>
        </span>
        <span class="action-range"><strong>${escapeHtml(action.range)}</strong><span>${escapeHtml(action.rangeLabel)}</span></span>
        <span class="action-hit">${escapeHtml(action.hit)}</span>
        <span class="action-damage">${action.damage.map((damage) => `<span>${escapeHtml(damage)}</span>`).join("") || "--"}</span>
        <span class="action-notes">${escapeHtml(action.notes)}</span>
      </button>
      ${open ? renderActionDetail(action) : ""}
    </article>
  `;
}

function renderActionDetail(action) {
  return `
    <div class="action-detail">
      ${action.detail ? paragraphs(action.detail) : `<p>${escapeHtml(action.notes || "Sem detalhes adicionais.")}</p>`}
      ${renderActionUse(action)}
    </div>
  `;
}

function renderActionUse(action) {
  if (action.resource) return renderResourceUse(action.resource);
  if (action.slotLevel) {
    const remaining = availableSpellSlotsAtLevel(action.slotLevel);
    return `
      <div class="resource-use">
        <button type="button" class="cast-button" data-use-action="${escapeHtml(action.id)}" ${remaining ? "" : "disabled"}>Cast</button>
        <span>${remaining} slot(s) de nivel ${action.slotLevel} disponivel</span>
      </div>
    `;
  }
  return "";
}

function renderResourceUse(resourceId) {
  const resource = state.character.resources?.[resourceId];
  if (!resource) return "";
  const remaining = Math.max(0, resource.max - resource.used);
  const recovery = resourceRecoveryLabel(resource.recovery);
  return `
    <div class="resource-use">
      <button type="button" class="cast-button" data-use-resource="${escapeHtml(resourceId)}" ${remaining ? "" : "disabled"}>Use</button>
      <span>${remaining}/${resource.max} disponivel - recupera em ${recovery.replace(" Resource", "")}</span>
    </div>
  `;
}

function actionFilterTitle(filter) {
  const labels = {
    all: "Actions",
    attack: "Actions",
    action: "Actions",
    bonus: "Bonus Actions",
    reaction: "Reactions",
    other: "Other",
    limited: "Limited Use",
  };
  return labels[filter] ?? "Actions";
}

function currentActionItems() {
  return deriveAvailableActions(actionEngineContext());
}

function actionEngineContext() {
  return {
    character: { ...state.character, spells: currentKnownSpellNames() },
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

function currentAttackActions() {
  const attackAbility = state.character.class === "monk" || state.character.class === "rogue" ? "dex" : "str";
  return (state.character.attacks ?? []).map((attack, index) => {
    const item = (state.character.inventory ?? []).find((entry) => entry.id === attack.itemId);
    return {
      id: `attack:${index}:${slugifyName(attack.name)}`,
      kind: "attack",
      icon: "⚔",
      name: attack.name,
      subtitle: item ? itemTypeLabel(item) : "Weapon / Attack",
      range: compactRange(attack.range),
      rangeLabel: rangeLabel(attack.range),
      hit: signed(proficiency() + mod(attackAbility)),
      damage: [`${attack.damage}${signed(mod(attackAbility))}`],
      notes: item ? itemTags(item).join(", ") : attack.type,
      detail: item ? entriesToText(item.entries) : "",
    };
  });
}

function currentSpellActions() {
  return currentKnownSpellNames()
    .map((name) => state.api.source?.spellDetails?.[name.toLowerCase()] ?? state.api.spellDetails?.[name] ?? null)
    .filter(Boolean)
    .filter((spell) => spellActionVisible(spell))
    .map((spell) => {
      const kind = actionKindForSpell(spell);
      return {
        id: `spell-action:${slugifyName(spell.name)}`,
        kind,
        icon: "✦",
        name: spell.name,
        subtitle: spell.level === 0 ? "Cantrip" : `Magia nivel ${spell.level}`,
        range: compactRange(spell.range),
        rangeLabel: spell.range === "Self" ? "Self" : "Range",
        hit: spellHitOrDc(spell),
      damage: spellDamageChips(spell.description),
      notes: spell.components || spell.levelLine || "Magic",
      detail: spell.description,
      };
    });
}

function rulesActionItems() {
  return [
    {
      id: "rule:attack",
      kind: "action",
      icon: "A",
      name: "Attack",
      subtitle: "Combat Action",
      range: "--",
      rangeLabel: "Varies",
      hit: "--",
      damage: [],
      notes: "Make one attack with a weapon or an Unarmed Strike.",
      detail: "When you take the Attack action, you can make one attack roll with a weapon or an Unarmed Strike.",
    },
    {
      id: "rule:dash",
      kind: "action",
      icon: "A",
      name: "Dash",
      subtitle: "Combat Action",
      range: "Self",
      rangeLabel: "Move",
      hit: "--",
      damage: [],
      notes: "Gain extra movement for the current turn.",
      detail: "When you take the Dash action, you gain extra movement for the current turn. The increase equals your Speed after applying any modifiers.",
    },
    {
      id: "rule:dodge",
      kind: "action",
      icon: "A",
      name: "Dodge",
      subtitle: "Combat Action",
      range: "Self",
      rangeLabel: "Defense",
      hit: "--",
      damage: [],
      notes: "Attacks against you have Disadvantage.",
      detail: "Until the start of your next turn, any attack roll made against you has Disadvantage if you can see the attacker, and you make Dexterity saving throws with Advantage.",
    },
    {
      id: "rule:two-weapon",
      kind: "bonus",
      icon: "BA",
      name: "Two-Weapon Fighting",
      subtitle: "Bonus Action",
      range: "Melee",
      rangeLabel: "Weapon",
      hit: "--",
      damage: [],
      notes: "Extra attack with eligible Light weapons.",
      detail: "When you make the extra attack of the Light property, you don't add your ability modifier to the extra attack's damage unless that modifier is negative.",
    },
    {
      id: "rule:opportunity",
      kind: "reaction",
      icon: "R",
      name: "Opportunity Attack",
      subtitle: "Reaction",
      range: "Reach",
      rangeLabel: "Melee",
      hit: "--",
      damage: [],
      notes: "A creature leaves your reach.",
      detail: "You can make an Opportunity Attack when a creature that you can see leaves your reach using its action, Bonus Action, Reaction, or movement.",
    },
    {
      id: "rule:interact",
      kind: "other",
      icon: "O",
      name: "Interact with an Object",
      subtitle: "Other",
      range: "Touch",
      rangeLabel: "Object",
      hit: "--",
      damage: [],
      notes: "Interact with one object or feature.",
      detail: "You normally interact with one object or feature of the environment for free, during either your move or your action.",
    },
  ];
}

function featureActionItems() {
  const items = [];
  currentResourceDefinitions().forEach((resourceDef) => {
    const resource = state.character.resources?.[resourceDef.id];
    const remaining = resource ? Math.max(0, resource.max - resource.used) : 0;
    const subtitle = resourceDef.kind === "species" ? resourceDef.sourceLabel : `${resourceDef.className} Feature`;
    if (resourceDef.actionKind) {
      items.push({
        id: `feature:${resourceDef.id}`,
        kind: resourceDef.actionKind,
        icon: actionIconForKind(resourceDef.actionKind),
        name: resourceDef.name,
        subtitle,
        range: "Self",
        rangeLabel: "Resource",
        hit: "--",
        damage: [],
        notes: `${remaining}/${resource?.max ?? 0} uses`,
        detail: resourceDef.body,
        resource: resourceDef.id,
      });
    }
    items.push({
      id: `limited:${resourceDef.id}`,
      kind: "limited",
      icon: "LU",
      name: `${resourceDef.name} Uses`,
      subtitle: resourceRecoveryLabel(resourceDef.recovery),
      range: "Self",
      rangeLabel: "Resource",
      hit: "--",
      damage: [],
      notes: `${remaining}/${resource?.max ?? 0} disponivel`,
      detail: resourceDef.body,
      resource: resourceDef.id,
    });
  });
  return items;
}

function spellActionVisible(spell) {
  const kind = actionKindForSpell(spell);
  if (kind === "bonus" || kind === "reaction") return true;
  const damage = spellDamageChips(spell.description);
  const hit = spellHitOrDc(spell);
  if (kind === "attack") return damage.length || hit !== "--";
  return spell.level > 0 || (spell.level === 0 && kind === "action");
}

function actionKindForSpell(spell) {
  const text = String(spell.castingTime).toLowerCase();
  if (text.includes("bonus")) return "bonus";
  if (text.includes("reaction")) return "reaction";
  if (spellDamageChips(spell.description).length || spellHitOrDc(spell) !== "--") return "attack";
  if (/ritual/i.test(`${spell.name} ${spell.description}`)) return "other";
  return actionKindFromCastingTime(spell.castingTime);
}

function actionKindFromCastingTime(castingTime = "") {
  const text = String(castingTime).toLowerCase();
  if (text.includes("bonus")) return "bonus";
  if (text.includes("reaction")) return "reaction";
  if (text.includes("action")) return "action";
  return "other";
}

function spellHitOrDc(spell) {
  const description = String(spell.description ?? "").toLowerCase();
  if (description.includes("saving throw")) return String(8 + proficiency() + mod(spellAbility()));
  if (description.includes("spell attack")) return signed(proficiency() + mod(spellAbility()));
  return "--";
}

function spellDamageChips(description = "") {
  const matches = [...String(description).matchAll(/\b\d+d\d+(?:\s*[+-]\s*\d+)?\b/gi)].map((match) => match[0].replace(/\s+/g, ""));
  return [...new Set(matches)].slice(0, 2);
}

function compactRange(range = "") {
  return String(range).replace(/\bfeet\b/i, "ft.").replace(/\bfoot\b/i, "ft.");
}

function rangeLabel(range = "") {
  return /feet|ft\.?/i.test(String(range)) ? "Reach" : "Range";
}

function normalizeComparableText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function autoGrantedSpellEntries() {
  const sources = [...currentClassFeatureItems(), ...currentSpeciesTraitItems()];
  const grants = new Map();
  const choicePattern = /(choose|choice|of your choice|of your choosing)/i;

  sources.forEach((feature) => {
    const body = String(feature.body ?? "");
    const refs = explicitSpellRefsFromText(body);
    if (!refs.length) return;
    if (choicePattern.test(body) && !/(you know|always have|prepared)/i.test(body)) return;

    const spellDetails = state.api.source?.spellDetails ?? {};
    refs.forEach((spellName) => {
      const spell = spellDetails[spellName.toLowerCase()];
      if (!spell?.name) return;
      grants.set(spell.name, {
        name: spell.name,
        level: Number(spell.level) || 0,
        origin: feature.name,
        sourceLabel: feature.meta,
      });
    });
  });

  return [...grants.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function explicitSpellRefsFromText(text) {
  return [...String(text ?? "").matchAll(/\{@spell ([^|}]+)(?:\|[^}]*)?\}/gi)]
    .map((match) => clean5etoolsText(match[1]).trim())
    .filter(Boolean);
}

function autoGrantedCantripNames() {
  return autoGrantedSpellEntries().filter((spell) => spell.level === 0).map((spell) => spell.name);
}

function autoGrantedSpellNameSet() {
  return new Set(autoGrantedSpellEntries().map((spell) => spell.name));
}

function renderSpellsSheet() {
  const autoSpells = autoGrantedSpellEntries();
  const autoLeveledSpells = autoSpells.filter((spell) => spell.level > 0);
  const autoCantrips = autoGrantedCantripNames();
  const backgroundSpells = backgroundSelectedSpellNames();
  const spells = currentKnownSpellNames();
  const selected = state.selectedSpell && spells.includes(state.selectedSpell) ? state.selectedSpell : "";
  const knownSpells = spells.map(spellFromKnownData).filter((spell) => spell?.name && Number.isFinite(spell.level));
  return `
    <div class="metric-row">
      ${smallStat("C Level", casterLevel())}
      ${smallStat("Spell Attack", signed(proficiency() + mod(spellAbility())))}
      ${smallStat("Spell DC", 8 + proficiency() + mod(spellAbility()))}
    </div>
    ${autoLeveledSpells.length ? renderAutoGrantedSpells(autoLeveledSpells) : ""}
    ${renderSpellSheetGroups(knownSpells, selected)}
    ${backgroundSpells.length ? renderBackgroundSpellSource(backgroundSpells) : ""}
    ${spells.length || autoLeveledSpells.length ? "" : `<div class="empty-state">Nenhuma magia selecionada para esta ficha.</div>`}
  `;
}

function currentKnownSpellNames() {
  return [...new Set([
    ...(state.character.spells ?? []),
    ...backgroundSelectedSpellNames(),
    ...autoGrantedCantripNames(),
  ])];
}

function renderBackgroundSpellSource(spells) {
  return `
    <section class="feature-section">
      <h3>Magias de background</h3>
      <div class="auto-spell-list">
        ${spells.map((name) => {
          const detail = spellFromKnownData(name);
          return `
            <article class="auto-spell-card">
              <strong>${escapeHtml(name)}</strong>
              <span>${escapeHtml(detail?.level === 0 ? "Cantrip" : `${ordinalLabel(detail?.level ?? 1)}-level spell`)}</span>
              <em>Magic Initiate</em>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderAutoGrantedSpells(spells) {
  return `
    <section class="feature-section">
      <h3>Magias automáticas</h3>
      <div class="auto-spell-list">
        ${spells.map((spell) => {
          const detail = spellFromKnownData(spell.name) ?? spell;
          return `
            <article class="auto-spell-card">
              <strong>${escapeHtml(detail.name)}</strong>
              <span>${escapeHtml(detail.level === 0 ? "Cantrip" : `${ordinalLabel(detail.level)}-level spell`)}</span>
              <em>${escapeHtml(spell.origin)}</em>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderSpellSheetGroups(spells, selected) {
  const cantrips = spells.filter((spell) => spell.level === 0).sort((a, b) => a.name.localeCompare(b.name));
  const leveled = spells.filter((spell) => spell.level > 0).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const slotLevels = Object.keys(spellSlotsMaxByLevel()).map(Number).sort((a, b) => a - b);
  const fallbackLevels = [...new Set(leveled.map((spell) => spell.level))].sort((a, b) => a - b);
  return [
    cantrips.length ? renderSpellSheetGroup(0, cantrips, selected) : "",
    ...(slotLevels.length ? slotLevels : fallbackLevels).map((slotLevel) =>
      renderSpellSheetGroup(slotLevel, leveled.filter((spell) => spell.level <= slotLevel), selected)
    ),
  ].join("");
}

function renderSpellSheetGroup(level, spells, selected) {
  if (!spells.length) return "";
  return `
    <section class="spell-sheet-group">
      <div class="spell-strip">
        <span>${spellLevelLabel(level)}</span>
        ${level > 0 ? renderSpellSlotTrack(level) : ""}
      </div>
      ${spells.map((spell) => renderSpellSheetRow(spell, selected, level)).join("")}
    </section>
  `;
}

function renderSpellSheetRow(spell, selected, slotLevel = spell.level) {
  const isSelected = spell.name === selected;
  const canCast = spell.level > 0 && availableSpellSlotsAtLevel(slotLevel) > 0;
  const badge = spell.level > 0 && spell.level !== slotLevel ? `<span class="spell-level-badge">${ordinalLabel(spell.level)}</span>` : "";
  return `
    <div class="spell-row">
      ${spell.level > 0 ? `<button type="button" class="cast-button" data-cast-spell-level="${slotLevel}" ${canCast ? "" : "disabled"}>${badge}Cast</button>` : `<span class="spell-at-will">At Will</span>`}
      <button type="button" class="purple-strip spell-button ${isSelected ? "active" : ""}" data-spell-name="${escapeHtml(spell.name)}">${escapeHtml(spell.name)}</button>
    </div>
    ${isSelected ? renderSpellCard(spell.name) : ""}
  `;
}

function renderSpellSlotTrack(level) {
  const slot = state.character.spellSlots?.[level] ?? { max: spellSlotsMaxByLevel()[level] ?? 0, used: 0 };
  if (!slot.max) return "";
  return `
    <span class="spell-slots" aria-label="Slots nivel ${level}">
      ${Array.from({ length: slot.max }, (_, index) => `<span class="slot-box ${index < slot.used ? "used" : ""}"></span>`).join("")}
      <strong>Slots</strong>
    </span>
  `;
}

function renderInventorySheet() {
  const inventory = state.character.inventory ?? [];
  const activeModifiers = state.derived?.activeModifiers ?? deriveActiveModifiers(state.character);
  const encumbrance = state.derived?.encumbrance;
  const weight = inventory.reduce((total, item) => total + (Number(item.weight) || 0) * (Number(item.quantity) || 1), 0);
  const gold = inventory.filter((item) => item.kind === "currency").reduce((total, item) => total + (Number(item.gp) || 0), 0);
  return `
    <div class="inventory-head">
      <div>
        <strong>Weight Carried: ${weight.toFixed(1)} lb.${encumbrance ? ` / ${encumbrance.carryingCapacity} lb.` : ""}</strong>
        <span>${encumbrance?.encumbered ? "Encumbered" : "Inventory pessoal"}</span>
      </div>
      <strong>${gold} GP</strong>
    </div>
    ${renderActiveModifierSummary(activeModifiers)}
    <div class="inventory-list">
      ${inventory.length ? inventory.map(renderInventoryRow).join("") : `<div class="empty-state">Escolha o equipamento inicial na etapa Escolhas.</div>`}
    </div>
  `;
}

function renderActiveModifierSummary(modifiers) {
  if (!modifiers.length) return "";
  return `
    <div class="inventory-modifiers">
      <strong>Modificadores ativos</strong>
      ${modifiers.map((modifier) => `
        <span>${escapeHtml(modifier.sourceName ?? modifier.sourceId ?? "Fonte")}: ${escapeHtml(modifier.target)} ${signed(Number(modifier.value) || 0)}</span>
      `).join("")}
    </div>
  `;
}

function renderInventoryRow(item) {
  const equipped = state.character.equippedItems?.includes(item.id);
  const equipable = isEquipableItem(item);
  return `
    <div class="inventory-row">
      <button type="button" class="equip-box ${equipped ? "equipped" : ""}" data-toggle-equip="${item.id}" ${equipable ? "" : "disabled"} aria-label="Equipar ${escapeHtml(item.name)}"></button>
      <div>
        <strong>${escapeHtml(item.name)}${item.quantity > 1 ? ` x${item.quantity}` : ""}</strong>
        <span>${escapeHtml(item.typeLabel ?? item.kind ?? "Item")}</span>
      </div>
      <span>${item.weight ? `${item.weight} lb.` : "--"}</span>
      <span>${item.valueGp ? `${item.valueGp} GP` : "--"}</span>
      <em>${escapeHtml(itemTags(item).join(", "))}</em>
    </div>
  `;
}

function renderSpellCard(spellName) {
  const detail = state.api.spellDetails[spellName];
  const deck = spellDeck();
  if (!detail) {
    return `<article class="spell-card deck-${deck}"><div class="spell-card-title">${escapeHtml(spellName)}</div><div class="spell-card-body">Carregando descricao...</div></article>`;
  }

  return `
    <article class="spell-card deck-${deck}">
      <button type="button" class="spell-close" data-close-spell aria-label="Fechar descricao">x</button>
      <div class="spell-card-title">${escapeHtml(detail.name)}</div>
      <div class="spell-card-subtitle">${escapeHtml(detail.levelLine)}</div>
      <div class="spell-facts">
        ${spellFact("Casting Time", detail.castingTime)}
        ${spellFact("Range", detail.range)}
        ${spellFact("Components", detail.components)}
        ${spellFact("Duration", detail.duration)}
      </div>
      ${detail.material ? `<div class="spell-material"><strong>Material:</strong> ${escapeHtml(detail.material)}</div>` : ""}
      <div class="spell-card-body">${paragraphs(detail.description)}</div>
      ${detail.higherLevel ? `
        <div class="spell-higher-label">At Higher Levels</div>
        <div class="spell-card-body higher">${paragraphs(detail.higherLevel)}</div>
      ` : ""}
      <div class="spell-footer"><strong>${escapeHtml(deckLabel(deck))}</strong><span>D&D</span></div>
    </article>
  `;
}

function spellFact(label, value) {
  return `<div><strong>${label}</strong><span>${escapeHtml(value || "-")}</span></div>`;
}

function renderFeaturesSheet() {
  const items = currentFeatureItems();
  const filter = state.featureFilter ?? "all";
  const filtered = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const filters = [
    ["all", "All"],
    ["class", "Class Features"],
    ["species", "Species Traits"],
    ["feat", "Feats"],
  ];
  return `
    <div class="feature-filter-row">
      ${filters.map(([id, label]) => `<button type="button" class="feature-filter ${filter === id ? "active" : ""}" data-feature-filter="${id}">${label}</button>`).join("")}
    </div>
    <div class="feature-section-list">
      ${renderFeatureSection("Class Features", filtered.filter((item) => item.kind === "class"))}
      ${renderFeatureSection("Species Traits", filtered.filter((item) => item.kind === "species"))}
      ${renderFeatureSection("Feats", filtered.filter((item) => item.kind === "feat"))}
    </div>
    ${filtered.length ? "" : `<div class="empty-state">Nenhuma feature nesta categoria.</div>`}
  `;
}

function renderFeatureSection(title, items) {
  if (!items.length) return "";
  return `
    <section class="feature-section">
      <h3>${title}</h3>
      <div class="feature-button-list">
        ${items.map((item) => `
          <button type="button" class="feature-button ${state.selectedFeature === item.id ? "active" : ""}" data-feature-id="${item.id}">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.meta)}</span>
          </button>
          ${state.selectedFeature === item.id ? renderFeatureDetail(item) : ""}
        `).join("")}
      </div>
    </section>
  `;
}

function renderFeatureDetail(item) {
  const choiceLines = featureChoiceSummary(item);
  const resource = resourceDefinitionForFeatureName(item.name);
  return `
    <article class="feature-detail-card">
      <button type="button" class="spell-close" data-close-feature aria-label="Fechar detalhe">x</button>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.meta)}</p>
      ${choiceLines.length ? `<div class="feature-choice-summary">${choiceLines.map((line) => `<strong>${escapeHtml(line)}</strong>`).join("")}</div>` : ""}
      ${resource ? renderResourceUse(resource.id) : ""}
      <div>${paragraphs(item.body || "Detalhe indisponivel nos dados 5etools 2024.")}</div>
    </article>
  `;
}

function featureChoiceSummary(item) {
  const summaries = [];
  const featureSlug = item.id.split(":")[1];
  const matchingRule = classCreationChoiceRules().find((rule) => slugifyName(rule.name) === featureSlug || rule.id === featureSlug);
  const selected = matchingRule ? state.character.classFeatureChoices?.[matchingRule.id] : "";
  if (matchingRule && selected) {
    const option = matchingRule.options?.find((entry) => entry.value === selected);
    if (option) summaries.push(`Escolha: ${option.label}`);
  }
  if (item.kind === "species" && /lineage|ancestry|legacy/i.test(item.name) && state.character.subrace) {
    summaries.push(`Escolha: ${state.character.subrace}`);
  }
  return summaries;
}

function bigStat(label, value) {
  return `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function smallStat(label, value) {
  return `<div class="small-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function abilityCard(key, label) {
  const save = state.derived?.savingThrows?.[key] ?? mod(key) + (state.character.savingThrows.includes(key) ? proficiency() : 0);
  return `
    <article class="ability-card">
      <h3>${label}</h3>
      <div class="ability-values">
        <div><span>Score</span><strong>${abilityScore(key)}</strong></div>
        <div><span>Modifier</span><strong>${signed(mod(key))}</strong></div>
        <div><span>Save</span><strong>${signed(save)}</strong></div>
      </div>
    </article>
  `;
}

function getLevelPlan() {
  const levels = state.api.levels[state.character.class];
  if (Array.isArray(levels) && levels.length) {
    return levels.slice(0, state.character.level).map((level) => ({
      level: level.level,
      title: `${titleCase(state.character.class)} progression`,
      summary: `Proficiency ${signed(level.prof_bonus)}${level.ability_score_bonuses ? `, ASI total ${level.ability_score_bonuses}` : ""}.`,
      choices: [
        ...(level.features ?? []).map((feature) => feature.name),
        ...classSpecificChoices(level),
      ],
    }));
  }

  return [];
}

function classSpecificChoices(level) {
  const details = [];
  if (level.class_specific?.ki_points) details.push(`Ki Points: ${level.class_specific.ki_points}`);
  if (level.spellcasting) details.push(`Spell slots e magias liberadas neste nivel`);
  if (level.ability_score_bonuses) details.push("Escolha ASI ou feat, conforme a mesa permitir");
  return details;
}

function currentFeatureItems() {
  return [
    ...currentClassFeatureItems(),
    ...currentSpeciesTraitItems(),
    ...currentFeatItems(),
  ];
}

function currentClassFeatureItems() {
  const className = state.api.classes[state.character.class]?.name ?? titleCase(state.character.class);
  const unselectedOptionNames = new Set(classCreationChoiceRules().filter((rule) => Array.isArray(rule.options)).flatMap((rule) =>
    rule.options
      .filter((option) => state.character.classFeatureChoices?.[rule.id] !== option.value)
      .map((option) => option.label)
  ));
  return (state.api.source?.classFeatures ?? [])
    .filter((feature) => slugifyName(feature.className) === state.character.class && Number(feature.level) <= state.character.level)
    .filter((feature) => !unselectedOptionNames.has(feature.name))
    .map((feature) => ({
      id: `class:${slugifyName(feature.name)}:${feature.level}`,
      kind: "class",
      name: feature.name,
      meta: `${className} ${feature.level} • ${feature.source}`,
      body: feature.body,
    }));
}

function currentClassFeatureData() {
  const unselectedOptionNames = new Set(classCreationChoiceRules().filter((rule) => Array.isArray(rule.options)).flatMap((rule) =>
    rule.options
      .filter((option) => state.character.classFeatureChoices?.[rule.id] !== option.value)
      .map((option) => option.label)
  ));
  return (state.api.source?.classFeatures ?? [])
    .filter((feature) => slugifyName(feature.className) === state.character.class && Number(feature.level) <= state.character.level)
    .filter((feature) => !unselectedOptionNames.has(feature.name));
}

const RESOURCE_META = [
  { id: "rage", name: "Rage", tableLabels: ["Rages"], match: /^rage(?:$|[:(])/i },
  { id: "wildShape", name: "Wild Shape", tableLabels: ["Wild Shape"], match: /^wild shape(?:$|[:(])/i },
  { id: "channelDivinity", name: "Channel Divinity", tableLabels: ["Channel Divinity"], match: /^channel divinity(?:$|[:(])/i },
  { id: "secondWind", name: "Second Wind", tableLabels: ["Second Wind"], match: /^second wind(?:$|[:(])/i },
  { id: "actionSurge", name: "Action Surge", tableLabels: ["Action Surge"], match: /^action surge(?:$|[:(])/i },
  { id: "bardicInspiration", name: "Bardic Inspiration", tableLabels: [], match: /^bardic inspiration(?:$|[:(])/i },
  { id: "flashOfGenius", name: "Flash of Genius", tableLabels: [], match: /^flash of genius(?:$|[:(])/i },
  { id: "healingHands", name: "Healing Hands", tableLabels: [], match: /^healing hands(?:$|[:(])/i },
  { id: "radiantSoul", name: "Radiant Soul", tableLabels: [], match: /^radiant soul(?:$|[:(])/i },
  { id: "necroticShroud", name: "Necrotic Shroud", tableLabels: [], match: /^necrotic shroud(?:$|[:(])/i },
  { id: "furyOfTheSmall", name: "Fury of the Small", tableLabels: [], match: /^fury of the small(?:$|[:(])/i },
  { id: "relentlessEndurance", name: "Relentless Endurance", tableLabels: [], match: /^relentless endurance(?:$|[:(])/i },
  { id: "stonesEndurance", name: "Stone's Endurance", tableLabels: [], match: /^stone'?s endurance(?:$|[:(])/i },
  { id: "feyStep", name: "Fey Step", tableLabels: [], match: /^fey step(?:$|[:(])/i },
  { id: "infernalLegacy", name: "Infernal Legacy", tableLabels: [], match: /^infernal legacy(?:$|[:(])/i },
];

function currentClassResourceDefinitions() {
  const byId = new Map();
  currentClassFeatureData().forEach((feature) => {
    const resource = resourceDefinitionFromFeature(feature);
    if (!resource) return;
    const existing = byId.get(resource.id);
    byId.set(resource.id, existing ? mergeResourceDefinitions(existing, resource) : resource);
  });
  return [...byId.values()].sort((a, b) => (Number(a.level) - Number(b.level)) || a.name.localeCompare(b.name));
}

function currentSpeciesResourceDefinitions() {
  const byId = new Map();
  currentSpeciesTraitItems().forEach((trait) => {
    const resource = resourceDefinitionFromTraitItem(trait);
    if (!resource) return;
    const existing = byId.get(resource.id);
    byId.set(resource.id, existing ? mergeResourceDefinitions(existing, resource) : resource);
  });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function currentResourceDefinitions() {
  return [...currentClassResourceDefinitions(), ...currentSpeciesResourceDefinitions()];
}

function resourceDefinitionForFeatureName(name) {
  const normalizedName = clean5etoolsText(name).toLowerCase();
  return currentResourceDefinitions().find((definition) => definition.name.toLowerCase() === normalizedName) ?? null;
}

function resourceDefinitionFromFeature(feature) {
  const meta = resourceMetaFromFeatureName(feature.name);
  if (!meta) return null;
  const body = String(feature.body ?? "");
  const recovery = resourceRecoveryFromBody(body);
  const actionKind = resourceActionKindFromBody(body);
  const max = resourceMaxFromBody(body, feature.name, meta, Number(feature.level) || 1);
  if ((!max || !Number.isFinite(max) || max <= 0) && !Object.keys(recovery).length && !actionKind) return null;
  return {
    id: meta.id,
    name: meta.name,
    className: state.api.classes[state.character.class]?.name ?? titleCase(state.character.class),
    feature,
    body,
    level: Number(feature.level) || 1,
    max: max || 0,
    recovery,
    actionKind,
    isCanonical: meta.isCanonical,
  };
}

function resourceDefinitionFromTraitItem(trait) {
  const meta = resourceMetaFromFeatureName(trait.name);
  const body = String(trait.body ?? "");
  const recovery = resourceRecoveryFromBody(body);
  const actionKind = resourceActionKindFromBody(body);
  const max = resourceMaxFromBody(body, trait.name, meta, 1);
  if ((!max || !Number.isFinite(max) || max <= 0) && !Object.keys(recovery).length && !actionKind) return null;
  return {
    id: trait.id,
    name: meta?.name ?? trait.name,
    kind: "species",
    sourceLabel: trait.meta,
    body,
    level: 1,
    max: max || 0,
    recovery,
    actionKind,
    isCanonical: Boolean(meta?.isCanonical),
  };
}

function mergeResourceDefinitions(existing, incoming) {
  const next = { ...existing, recovery: { ...(existing.recovery ?? {}) } };
  if (!next.feature && incoming.feature) next.feature = incoming.feature;
  if (!next.body && incoming.body) next.body = incoming.body;
  if (!next.sourceLabel && incoming.sourceLabel) next.sourceLabel = incoming.sourceLabel;
  if (incoming.max && (!next.max || incoming.max > next.max)) next.max = incoming.max;
  if (!next.actionKind && incoming.actionKind) next.actionKind = incoming.actionKind;
  if (incoming.recovery?.short && !next.recovery.short) next.recovery.short = incoming.recovery.short;
  if (incoming.recovery?.long && !next.recovery.long) next.recovery.long = incoming.recovery.long;
  if (incoming.isCanonical) next.isCanonical = true;
  return next;
}

function resourceMetaFromFeatureName(name) {
  const cleanName = clean5etoolsText(name);
  const meta = RESOURCE_META.find((entry) => entry.match.test(cleanName));
  if (!meta) return null;
  return {
    ...meta,
    isCanonical: cleanName.toLowerCase() === meta.name.toLowerCase(),
  };
}

function resourceMaxFromBody(body, name = "", meta = null, level = 1) {
  const text = String(body ?? "");
  const tableValue = meta ? classTableResourceValue(meta.tableLabels, Number(level) || 1) : 0;
  if (Number.isFinite(tableValue) && tableValue > 0) return tableValue;
  if (/\bonce (?:you )?use this (?:trait|feature|ability)\b/i.test(text)) return 1;
  if (/can't use (?:it|this (?:trait|feature|ability|spell(?: again)?|trait again|ability again)|that spell) again until you finish a short or long rest/i.test(text)) return 1;
  if (/can't use (?:it|this (?:trait|feature|ability|spell(?: again)?|trait again|ability again)|that spell) again until you finish a (?:short|long) rest/i.test(text)) return 1;
  if (/once per (?:short|long) rest/i.test(text)) return 1;
  if (/regain the ability to do so when you finish a (?:short|long) rest/i.test(text)) return 1;
  if (/regain the ability to cast it when you finish a long rest/i.test(text)) return 1;
  const modifierMatch = text.match(/number of times equal to your ([A-Za-z]+) modifier/i);
  if (modifierMatch) return Math.max(1, abilityModifierFromLabel(modifierMatch[1]));
  const proficiencyMatch = text.match(/(?:number of times|a number of times|uses) equal to your proficiency bonus/i);
  if (proficiencyMatch) return Math.max(1, proficiency());
  const fixedMatch = text.match(/\b(once|twice|thrice)\b/i);
  if (fixedMatch) {
    const fixed = { once: 1, twice: 2, thrice: 3 }[fixedMatch[1].toLowerCase()];
    if (fixed) return fixed;
  }
  const numericMatch = text.match(/(?:you can use this feature|you can use this class's [^]+?|you can enter your rage|you can confer a bardic inspiration die)[^.\n]*?(\d+)\b/i);
  if (numericMatch) return Number(numericMatch[1]) || 0;
  return 0;
}

function resourceMaxFromFeature(feature, meta) {
  return resourceMaxFromBody(String(feature.body ?? ""), feature.name, meta, Number(feature.level) || 1);
}

function classTableResourceValue(labels, level) {
  const classData = state.api.classes[state.character.class];
  if (!classData) return 0;
  const rowIndex = Math.max(0, Number(level) - 1);
  for (const group of classData.classTableGroups ?? []) {
    const colIndex = (group.colLabels ?? []).findIndex((label) => labels.some((needle) => clean5etoolsText(label).toLowerCase() === clean5etoolsText(needle).toLowerCase()));
    if (colIndex === -1) continue;
    const cell = group.rows?.[rowIndex]?.[colIndex];
    const numeric = parseTableCellValue(cell);
    if (numeric) return numeric;
  }
  return 0;
}

function parseTableCellValue(cell) {
  if (cell == null) return 0;
  if (typeof cell === "number") return cell;
  if (typeof cell === "string") {
    const cleaned = clean5etoolsText(cell);
    if (!cleaned || cleaned === "—" || /^unlimited$/i.test(cleaned)) return 0;
    const numeric = Number(cleaned.replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  if (typeof cell === "object") {
    if (typeof cell.value === "number") return cell.value;
    if (typeof cell.value === "string") return parseTableCellValue(cell.value);
    if (typeof cell.max === "number") return cell.max;
  }
  return 0;
}

function abilityModifierFromLabel(label) {
  const normalized = String(label ?? "").toLowerCase();
  const abilityMap = {
    charisma: "cha",
    constitution: "con",
    dexterity: "dex",
    intelligence: "int",
    strength: "str",
    wisdom: "wis",
    cha: "cha",
    con: "con",
    dex: "dex",
    int: "int",
    str: "str",
    wis: "wis",
  };
  const key = abilityMap[normalized];
  return key ? Math.max(1, mod(key)) : proficiency();
}

function resourceRecoveryFromBody(body) {
  const text = String(body ?? "");
  const recovery = {};
  if (/regain all expended uses when you finish a short rest/i.test(text)) recovery.short = "all";
  else if (/regain all your expended uses when you finish a short rest/i.test(text)) recovery.short = "all";
  else if (/regain all of (?:its|their|your) expended uses when you finish a short rest/i.test(text)) recovery.short = "all";
  else if (/regain one(?: of (?:its|their|your))? expended uses when you finish a short rest/i.test(text)) recovery.short = 1;
  else if (/regain all(?: your)? expended uses.*finish a (?:short rest(?: or long rest)?|short or long rest)/i.test(text)) recovery.short = "all";
  else if (/finish a short rest/i.test(text) && /regain all expended uses/i.test(text)) recovery.short = "all";
  else if (/finish a short rest/i.test(text) && /regain one expended use/i.test(text)) recovery.short = 1;
  else if (/short or long rest/i.test(text) && /can't use/i.test(text)) {
    recovery.short = "all";
    recovery.long = "all";
  }
  else if (/finish a short rest/i.test(text) && /can't use (?:it|this trait|this feature|this ability)/i.test(text) && /again/i.test(text)) recovery.short = "all";
// Action Surge pattern: "can't do so again until you finish a Short Rest or Long Rest"
else if (/can't use this feature again until you finish a (?:Short Rest|Long Rest)/i.test(text)) {
    recovery.short = "all";
    recovery.long = "all";
}
else if (/finish a (?:Short Rest|Long Rest)/i.test(text) && /can't.*again/i.test(text)) {
    recovery.short = "all";
    recovery.long = "all";
}

  // Pattern: "finish a Short Rest or Long Rest" (e.g., Action Surge, Second Wind)
if (/finish a .{0,100}Short Rest.{0,100}Long Rest/i.test(text) || /finish a .{0,100}Long Rest.{0,100}Short Rest/i.test(text)) {
  recovery.short = "all";
  recovery.long = "all";
}
// Pattern: "can't do so again until you finish" (Action Surge)
else if (/can't do so again until you finish/i.test(text)) {
  if (/short/i.test(text)) recovery.short = "all";
  if (/long/i.test(text)) recovery.long = "all";
}
// Pattern: "before a Short Rest or Long Rest" (Indomitable variant)
else if (/before a .{0,50}Short Rest/i.test(text) || /before a .{0,50}Long Rest/i.test(text)) {
  if (/short/i.test(text)) recovery.short = "all";
  if (/long/i.test(text)) recovery.long = "all";
}
// Pattern: "regain one expended use when you finish a Short Rest" (Second Wind)
else if (/regain one expended use when you finish a short rest/i.test(text)) {
  recovery.short = "1";
}

if (/regain all expended uses when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/regain all your expended uses when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/regain all of (?:its|their|your) expended uses when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/finish a long rest/i.test(text) && /regain all expended uses/i.test(text)) recovery.long = "all";
  else if (/once you use this trait/i.test(text) && /finish a long rest/i.test(text)) recovery.long = "all";
  else if (/can't use this trait again until you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/can't use (?:it|this trait|this feature|this ability) again until you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/regain the ability to cast it when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/regain the ability to do so when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/you regain the ability to cast it this way when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/you regain the ability to do so when you finish a long rest/i.test(text)) recovery.long = "all";
  else if (/you must finish a long rest in order to cast the spell again/i.test(text)) recovery.long = "all";

  return recovery;
}

function resourceActionKindFromBody(body) {
  const text = String(body ?? "").toLowerCase();
  if (text.includes("bonus action")) return "bonus";
  if (text.includes("reaction")) return "reaction";
  if (text.includes("additional action")) return "action";
  if (text.includes("as an action")) return "action";
  if (text.includes("magic action")) return "action";
  return "";
}

function resourceRecoveryLabel(recovery = {}) {
  if (recovery.short && recovery.long) return "Short or Long Rest Resource";
  if (recovery.short) return "Short Rest Resource";
  if (recovery.long) return "Long Rest Resource";
  return "Limited Use Resource";
}

function actionIconForKind(kind) {
  return {
    action: "A",
    bonus: "BA",
    reaction: "R",
    other: "O",
    limited: "LU",
  }[kind] ?? "LU";
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
        { value: "arcana", label: "Arcana", hint: `Bonus atual: ${signed(Math.max(1, mod("wis")))}` },
        { value: "nature", label: "Nature", hint: `Bonus atual: ${signed(Math.max(1, mod("wis")))}` },
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
  if (choice.pattern === "plus2") return abilityScoreBeforeAsiRule(choice.ability1, rule.id) <= 18;
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
        Object.entries(abilityReq).every(([key, value]) => abilityScore(key) >= value)
      );
    }
    if (prereq.spellcasting2020 && !classHasSpellList(state.character.class)) return false;
    return true;
  });
}

function asiAbilityOptions(exclude = "") {
  return ABILITIES
    .filter(([key]) => key !== exclude)
    .map(([key, label]) => [key, `${label} (${abilityScore(key)})`]);
}

function defaultAsiAbility() {
  const preferred = spellAbility();
  return ABILITIES.some(([key]) => key === preferred) ? preferred : "con";
}

function equipmentChoiceRules() {
  const rules = [];
  const classEquipment = state.api.classes[state.character.class]?.startingEquipment;
  if (classEquipment?.defaultData?.length) {
    rules.push(equipmentRuleFromData("class-starting-equipment", `${titleCase(state.character.class)} Equipment`, classEquipment));
  }
  const background = state.api.source?.backgroundDetails?.[String(state.character.background).toLowerCase()];
  if (background?.startingEquipment?.length) {
    rules.push(equipmentRuleFromData("background-starting-equipment", `${state.character.background} Equipment`, { defaultData: background.startingEquipment, entries: background.entries }));
  }
  return rules.filter(Boolean);
}

function equipmentRuleFromData(id, name, data) {
  const groups = data.defaultData ?? data.startingEquipment ?? [];
  const choices = groups[0] ?? {};
  const options = Object.entries(choices).map(([key, items]) => ({
    value: key,
    label: `Opcao ${key}`,
    hint: summarizeEquipmentItems(items),
    items,
  }));
  if (!options.length) return null;
  return {
    id,
    name,
    summary: entriesToText(data.entries).split("\n")[0] || "Escolha um pacote inicial.",
    options,
  };
}

function summarizeEquipmentItems(items) {
  return items.map((item) => {
    if (item.value) return `${Math.floor(item.value / 100)} GP`;
    if (item.special) return item.special;
    if (typeof item.item === "object") return summarizeEquipmentItems([item.item]);
    const parsed = parseItemRef(item.item);
    return `${item.quantity ? `${item.quantity} ` : ""}${parsed.name}`;
  }).join(", ");
}

function rebuildInventoryFromChoices() {
  const inventory = [];
  equipmentChoiceRules().forEach((rule) => {
    const selected = state.character.equipmentChoices?.[rule.id];
    const option = rule.options.find((item) => item.value === selected);
    if (!option) return;
    option.items.forEach((entry, index) => {
      inventory.push(...inventoryItemsFromEntry(entry, `${rule.id}:${selected}:${index}`));
    });
  });
  state.character.inventory = inventory;
  state.character.equippedItems = (state.character.equippedItems ?? []).filter((id) => inventory.some((item) => item.id === id));
}

function inventoryItemsFromEntry(entry, idBase) {
  if (entry.value) return [{ id: idBase, name: "Gold", kind: "currency", gp: Math.floor(entry.value / 100), quantity: 1 }];
  if (entry.special) return [{ id: idBase, name: entry.special, kind: "special", quantity: 1 }];
  if (typeof entry.item === "object") return inventoryItemsFromEntry(entry.item, idBase);
  if (!entry.item) return [];
  const parsed = parseItemRef(entry.item);
  const detail = itemDetail(parsed.name, parsed.source);
  return [normalizeInventoryItem(detail, parsed, entry.quantity ?? 1, idBase)];
}

function normalizeInventoryItem(detail, parsed, quantity, id) {
  const name = displayItemName(detail?.name ?? parsed.name);
  return {
    id,
    name,
    source: detail?.source ?? parsed.source,
    quantity,
    kind: "item",
    type: detail?.type,
    typeLabel: itemTypeLabel(detail),
    weight: detail?.weight ?? 0,
    valueGp: detail?.value ? detail.value / 100 : 0,
    ac: detail?.ac,
    damage: detail?.dmg1,
    damageType: detail?.dmgType,
    property: detail?.property ?? [],
    entries: detail?.entries ?? [],
  };
}

function parseItemRef(ref) {
  const [rawName, rawSource = "xphb"] = String(ref).split("|");
  return { name: titleCase(rawName), source: rawSource.toUpperCase() };
}

function itemDetail(name, source = "XPHB") {
  return state.api.source?.itemDetails?.[itemKey(displayItemName(name), source)] ?? state.api.source?.itemDetails?.[itemKey(name, source)];
}

function itemKey(name, source = "XPHB") {
  return `${String(name).toLowerCase()}|${String(source).toLowerCase()}`;
}

function displayItemName(name) {
  if (String(name).toLowerCase() === "druidic focus") return "Quarterstaff";
  return name;
}

function itemTypeLabel(item) {
  const type = String(item?.type ?? "");
  if (type.startsWith("S")) return "Shield";
  if (type.includes("A")) return "Armor";
  if (type.startsWith("M") || type.startsWith("R")) return "Weapon";
  if (type.includes("SCF")) return "Focus";
  return "Gear";
}

function itemTags(item) {
  const tags = [];
  if (item.ac) tags.push(`+${item.ac} AC`);
  if (item.damage) tags.push(`${item.damage} ${damageTypeLabel(item.damageType)}`);
  (item.property ?? []).forEach((prop) => tags.push(propertyLabel(prop)));
  return tags.filter(Boolean);
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

function currentSpeciesTraitItems() {
  const race = state.api.races[state.character.race]?.details;
  if (!race) return [];
  const selectedSubrace = selectedSubraceDetails();
  const entries = new Map();
  [...entriesNamedItems(race.entries), ...entriesNamedItems(selectedSubrace?.entries)].forEach((entry) => {
    entries.set(slugifyName(entry.name), entry);
  });
  return [...entries.values()].map((entry) => ({
    id: `species:${slugifyName(entry.name)}`,
    kind: "species",
    name: entry.name,
    meta: `${race.name}${selectedSubrace?.name ? ` • ${selectedSubrace.name}` : ""} • ${selectedSubrace?.source ?? race.source}`,
    body: entry.body,
  }));
}

function selectedSubraceDetails() {
  const subraceKey = slugifyName(state.character.subrace ?? "");
  if (!subraceKey) return null;
  return state.api.source?.subraceDetails?.[subraceKey] ?? null;
}

function currentFeatItems() {
  const background = state.api.source?.backgroundDetails?.[String(state.character.background).toLowerCase()];
  const featRefs = (background?.feats ?? []).flatMap((group) => Object.keys(group));
  const backgroundFeats = featRefs.map((ref) => {
    const parsed = parseFeatRef(ref);
    const detail = state.api.source?.featDetails?.[parsed.slug];
    return {
      id: `feat:${parsed.slug}:${slugifyName(parsed.variant)}`,
      kind: "feat",
      name: parsed.variant ? `${parsed.name} (${titleCase(parsed.variant)})` : parsed.name,
      meta: `${state.character.background} • ${detail?.source ?? "XPHB"}`,
      body: detail?.body ?? "",
    };
  });
  const chosenFeats = Object.entries(state.character.asiChoices ?? {})
    .filter(([, choice]) => choice?.mode === "feat" && choice.feat)
    .map(([ruleId, choice]) => {
      const detail = state.api.source?.featDetails?.[choice.feat];
      return {
        id: `feat:${ruleId}:${choice.feat}`,
        kind: "feat",
        name: detail?.name ?? titleCase(choice.feat),
        meta: `Level ${ruleId.replace("asi-", "")} • ${detail?.source ?? "XPHB"}`,
        body: detail?.body ?? "",
      };
    });
  const pickedFeats = Object.entries(state.character.classFeatureChoices ?? {})
    .filter(([ruleId]) => ruleId.startsWith("feat-"))
    .map(([ruleId, featSlug]) => {
      const detail = state.api.source?.featDetails?.[featSlug];
      return {
        id: `feat:${ruleId}:${featSlug}`,
        kind: "feat",
        name: detail?.name ?? titleCase(featSlug),
        meta: `Class Feature • ${detail?.source ?? "XPHB"}`,
        body: detail?.body ?? "",
      };
    });
  return [...backgroundFeats, ...chosenFeats, ...pickedFeats];
}

function entriesNamedItems(entries) {
  return (entries ?? [])
    .filter((entry) => entry?.type === "entries" && entry.name)
    .map((entry) => ({
      name: entry.name,
      body: entriesToText(entry.entries),
    }));
}

function parseFeatRef(ref) {
  const [namePart] = String(ref).split("|");
  const [name, variant = ""] = namePart.split(";");
  const cleanName = titleCase(name.trim());
  return {
    name: cleanName,
    variant: variant.trim(),
    slug: slugifyName(name.trim()),
  };
}

function spellOptions() {
  if (!classHasSpellList(state.character.class)) return state.character.spells;
  const legalOptions = legalSpellOptions();
  return [...new Set([...state.character.spells.filter((name) => legalSpellNames().has(name)), ...legalOptions.map((spell) => spell.name)])].slice(0, 60);
}

function renderSpellChoiceGroups(spellRule, spellCounts) {
  const legalByName = new Map(legalSpellOptions().map((spell) => [spell.name, spell]));
  const autoGranted = autoGrantedSpellNameSet();
  const selectedLegal = state.character.spells
    .filter((name) => legalSpellNames().has(name))
    .map((name) => legalByName.get(name) ?? spellFromKnownData(name))
    .filter((spell) => spell?.name && Number.isFinite(spell.level));
  const grouped = groupBySpellLevel([...selectedLegal, ...legalByName.values()]);

  if (!grouped.length) return `<div class="empty-state">Nenhuma magia disponivel para ${titleCase(state.character.class)} neste nivel.</div>`;

  return grouped.map(([level, spells]) => `
    <section class="spell-choice-group">
      <h3>${spellLevelLabel(level)} <span>${spellGroupCounter(level, spellRule, spellCounts)}</span></h3>
      <div class="choice-list">
        ${spells.map((spell) => checkbox("spells", spell.name, spell.name, state.character.spells.includes(spell.name) || autoGranted.has(spell.name), spellChoiceDisabled(spell, spellRule, spellCounts) || autoGranted.has(spell.name))).join("")}
      </div>
    </section>
  `).join("");
}

function spellGroupCounter(level, spellRule, spellCounts) {
  if (level === 0) return `${spellCounts.cantrips}/${spellRule.cantrips}`;
  return `${spellCounts.leveled}/${spellRule.spellsMax}`;
}

function spellChoiceDisabled(spell, spellRule, spellCounts) {
  if (spellRule.totalMax === 0) return true;
  if (autoGrantedSpellNameSet().has(spell.name)) return true;
  if (state.character.spells.includes(spell.name)) return false;
  if (spell.level === 0) return spellCounts.cantrips >= spellRule.cantrips;
  return spellCounts.leveled >= spellRule.spellsMax;
}

function legalSpellOptions() {
  const className = state.character.class;
  const maxLevel = maxSpellLevelAvailable();
  const rawClassSpells = state.api.classSpells?.[className] ?? [];
  const normalizedClassSpells = rawClassSpells
    .map((spell) => typeof spell === "string" ? spellFromKnownData(spell) : spell)
    .filter((spell) => spell?.name && Number.isFinite(spell.level));

  return normalizedClassSpells
    .filter((spell) => spell.level <= maxLevel)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function groupBySpellLevel(spells) {
  const unique = new Map();
  spells.forEach((spell) => {
    if (!unique.has(spell.name)) unique.set(spell.name, spell);
  });
  const groups = new Map();
  [...unique.values()].forEach((spell) => {
    if (!groups.has(spell.level)) groups.set(spell.level, []);
    groups.get(spell.level).push(spell);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, levelSpells]) => [level, levelSpells.sort((a, b) => a.name.localeCompare(b.name))]);
}

function spellLevelLabel(level) {
  return level === 0 ? "Cantrips" : `Magias de nivel ${level}`;
}

function ordinalLabel(level) {
  const labels = { 1: "1st", 2: "2nd", 3: "3rd" };
  return labels[level] ?? `${level}th`;
}

function legalSpellNames() {
  return new Set(legalSpellOptions().map((spell) => spell.name));
}

function selectedSpellCounts(spells = state.character.spells) {
  const autoCantrips = autoGrantedCantripNames();
  return spellListCounts(
    [...new Set([...spells, ...autoCantrips])]
      .map((name) => spellFromKnownData(name))
      .filter((spell) => spell?.name && Number.isFinite(spell.level))
  );
}

function spellListCounts(spells) {
  return spells.reduce((counts, spell) => {
    if (spell.level === 0) counts.cantrips += 1;
    else counts.leveled += 1;
    return counts;
  }, { cantrips: 0, leveled: 0 });
}

function spellSlotsMaxByLevel() {
  const spellcasting = currentLevelRow()?.spellcasting ?? {};
  return Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => {
      const level = index + 1;
      return [level, Number(spellcasting[`spell_slots_level_${level}`]) || 0];
    }).filter(([, max]) => max > 0)
  );
}

function syncSpellSlots() {
  state.character.spellSlots ??= {};
  const maxByLevel = spellSlotsMaxByLevel();
  const next = {};
  Object.entries(maxByLevel).forEach(([level, max]) => {
    const previous = state.character.spellSlots[level] ?? {};
    next[level] = {
      max,
      used: clamp(Number(previous.used) || 0, 0, max),
    };
  });
  state.character.spellSlots = next;
}

function availableSpellSlotsAtLevel(level) {
  const slot = state.character.spellSlots?.[level];
  return Math.max(0, (Number(slot?.max) || 0) - (Number(slot?.used) || 0));
}

function castSpell(slotLevel) {
  if (!slotLevel || slotLevel <= 0) return;
  syncSpellSlots();
  const slot = state.character.spellSlots?.[slotLevel];
  if (!slot || Number(slot.used) >= Number(slot.max)) return;
  slot.used += 1;
}

function resetSpellSlots(options = {}) {
  syncSpellSlots();
  Object.values(state.character.spellSlots ?? {}).forEach((slot) => {
    if (options.pactOnly && state.api.classes[state.character.class]?.casterProgression !== "pact") return;
    slot.used = 0;
  });
}

function syncResources() {
  state.character.resources ??= {};
  const next = {};
  currentResourceDefinitions().forEach((definition) => {
    const previous = state.character.resources[definition.id] ?? {};
    const max = Number(definition.max) || 0;
    if (max <= 0) return;
    next[definition.id] = {
      name: definition.name,
      max,
      used: clamp(Number(previous.used) || 0, 0, max),
      recovery: definition.recovery,
    };
  });
  state.character.resources = next;
}

function useResource(resourceId) {
  syncResources();
  const resource = state.character.resources?.[resourceId];
  if (!resource || resource.used >= resource.max) return;
  resource.used += 1;
}

function useAction(actionId) {
  const action = currentActionItems().find((item) => item.id === actionId);
  if (!action || action.disabled) return;
  if (action.slotLevel) {
    castSpell(action.slotLevel);
    return;
  }
  if (action.resource) useResource(action.resource);
}

function recoverShortRestResources() {
  Object.entries(state.character.resources ?? {}).forEach(([resourceId, resource]) => {
    const recovery = resource.recovery?.short;
    if (!recovery) return;
    if (resourceId === "secondWind") {
      resource.used = Math.max(0, resource.used - 1);
      return;
    }
    if (recovery === "all") {
      resource.used = 0;
      return;
    }
    resource.used = Math.max(0, resource.used - Number(recovery || 0));
  });
}

function recoverLongRestResources() {
  Object.values(state.character.resources ?? {}).forEach((resource) => {
    resource.used = 0;
  });
}

function applyRest(type) {
  state.restModalType = type;
  state.restModalHitDice = {};
  const isLong = type === "long";
  const description = isLong
    ? "Restaura HP ao maximo, recursos, slots e todos os Hit Dice."
    : "Pode gastar Hit Dice e recupera recursos de Short Rest.";
  state.restModalContent = { label: isLong ? "Long Rest" : "Short Rest", description };
  state.restModalOpen = true;
  renderSheet();
}

function confirmRest() {
  const type = state.restModalType;
  const isLong = type === "long";
  if (isLong) {
    state.character.hp = maxHitPoints();
    state.character.tempHp = 0;
    state.character.hitDiceUsed = 0;
    resetSpellSlots();
    recoverLongRestResources();
  } else {
    applySelectedHitDice();
    resetSpellSlots({ pactOnly: true });
    recoverShortRestResources();
  }
  state.validationMessage = `${isLong ? "Long Rest" : "Short Rest"} aplicado.`;
  state.restModalOpen = false;
  state.restModalContent = null;
  state.restModalHitDice = {};
  persist();
  render();
}

function applySelectedHitDice() {
  const selected = Object.values(state.restModalHitDice ?? {}).filter((entry) => entry?.value).length;
  if (!selected) return;
  const usable = Math.min(selected, availableHitDice());
  const healing = usable * hitDieHealingAmount();
  state.character.hp = Math.min(maxHitPoints(), (Number(state.character.hp) || 0) + healing);
  state.character.hitDiceUsed = Math.min(Number(state.character.level) || 1, (Number(state.character.hitDiceUsed) || 0) + usable);
}

function availableHitDice() {
  return Math.max(0, (Number(state.character.level) || 1) - (Number(state.character.hitDiceUsed) || 0));
}

function hitDieHealingAmount() {
  return Math.max(1, Math.floor(hitDie() / 2) + 1 + mod("con"));
}

function cancelRest() {
  state.restModalOpen = false;
  state.restModalContent = null;
  state.restModalType = null;
  state.restModalHitDice = {};
  renderRestModal();
  renderSheet();
}

function maxHitPoints() {
  const level = Number(state.character.level) || 1;
  const die = hitDie();
  const first = Math.max(1, die + mod("con"));
  const later = Math.max(1, fixedHpGain());
  return first + Math.max(0, level - 1) * later;
}

function spellFromKnownData(name) {
  const detail = state.api.spellDetails?.[name];
  if (detail && Number.isFinite(detail.level)) return { name, level: detail.level };
  const sourceDetail = state.api.source?.spellDetails?.[String(name).toLowerCase()];
  if (sourceDetail && Number.isFinite(sourceDetail.level)) return { name: sourceDetail.name, level: sourceDetail.level };
  return { name, level: Infinity };
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
  state.character.hp += gain;
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
  const con = mod("con");
  const min = Math.max(1, 1 + con);
  const max = Math.max(1, hitDie() + con);
  state.levelUpHpGain = clamp(Number(value) || min, min, max);
  state.character.hp = (state.levelUpHpBase || state.character.hp - state.levelUpHpGain) + state.levelUpHpGain;
}

function fixedHpGain() {
  return Math.max(1, Math.floor(hitDie() / 2) + 1 + mod("con"));
}

function maxLevelOneHp(className, abilities = state.character.abilities) {
  const die = state.api.classes?.[className]?.hit_die ?? CLASS_HIT_DIE[className] ?? 8;
  return Math.max(1, die + Math.floor(((abilities.con ?? 10) - 10) / 2));
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

  if (!spellcasting || !classHasSpellList(className) || casterLevel() === 0) {
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
  if (!classHasSpellList(className) || casterLevel() === 0) return 0;
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
  if (state.character.level === 1) state.character.hp = maxLevelOneHp(state.character.class, state.character.abilities);
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
  state.character.savingThrows = classSavingThrows();
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
    spellAbility: spellAbility(),
    modifiers: activeModifiers,
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
  const background = state.api.source?.backgroundDetails?.[String(backgroundName).toLowerCase()];
  return [...new Set((background?.skillProficiencies ?? []).flatMap((group) => {
    if (!group || typeof group !== "object") return [];
    return Object.entries(group)
      .filter(([, enabled]) => enabled === true)
      .map(([slug]) => skillNameFromSlug(slug));
  }))];
}


// Magic Initiate Background Spell Choices
function getBackgroundGrantedSpells() {
  const background = state.character.background?.toLowerCase();
  if (!background) return [];
  const bgDetails = state.api.source?.backgroundDetails?.[background];
  if (!bgDetails?.entries) return [];
  const granted = [];
  for (const entry of bgDetails.entries) {
    const entryStr = JSON.stringify(entry);
    if (entryStr.includes('Magic Initiate')) {
      let spellList = 'cleric';
      if (entryStr.includes('Wizard')) spellList = 'wizard';
      else if (entryStr.includes('Druid')) spellList = 'druid';
      granted.push({ type: 'magic_initiate', spellList, cantrips: 2, level1Spells: 1 });
    }
  }
  return granted;
}

function backgroundSpellChoiceRules() {
  const granted = getBackgroundGrantedSpells();
  return granted.map((grant, idx) => ({
    id: `bg-magic-initiate-${grant.spellList}-${idx}`,
    name: `Magic Initiate (${grant.spellList})`,
    type: 'bg_spell_choice',
    spellList: grant.spellList,
    cantrips: grant.cantrips,
    level1Spells: grant.level1Spells,
  }));
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
  const listKey = slugifyName(spellList);
  return (state.api.classSpells?.[listKey] ?? [])
    .map((spell) => spellFromKnownData(spell.name) ?? spell)
    .filter((spell) => spell?.name && Number.isFinite(Number(spell.level)) && Number(spell.level) <= 1)
    .sort((a, b) => Number(a.level) - Number(b.level) || a.name.localeCompare(b.name));
}

function backgroundSelectedSpellNames() {
  const names = [];
  backgroundSpellChoiceRules().forEach((rule) => {
    const storageKey = `bg-${rule.id}`;
    const legal = new Set(backgroundSpellOptions(rule.spellList).map((spell) => spell.name));
    (state.character.bgSpellChoices?.[storageKey] ?? [])
      .filter((name) => legal.has(name))
      .forEach((name) => names.push(name));
  });
  return [...new Set(names)];
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
  if (state.selectedSpell && !state.character.spells.includes(state.selectedSpell)) state.selectedSpell = state.character.spells[0] ?? "";
}

function syncInventoryEffects() {
  const inventory = state.character.inventory ?? [];
  state.character.equippedItems ??= [];
  const equipped = inventory.filter((item) => state.character.equippedItems.includes(item.id));
  const armor = equipped.find((item) => isArmorItem(item));
  const activeModifiers = deriveActiveModifiers(state.character);
  const dex = mod("dex");
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

function damageTypeLabel(type) {
  const labels = { B: "Bludgeoning", P: "Piercing", S: "Slashing" };
  return labels[type] ?? type ?? "";
}

function propertyLabel(prop) {
  const key = String(prop).split("|")[0];
  const labels = { V: "Versatile", L: "Light", T: "Thrown", F: "Finesse", H: "Heavy", R: "Reach", "2H": "Two-Handed" };
  return labels[key] ?? key;
}

function applyAbilityMethod(method) {
  state.character.abilityMethod = method;
  if (method === "standard") {
    state.character.abilities = Object.fromEntries(ABILITIES.map(([key], index) => [key, STANDARD_ARRAY[index]]));
  }
  if (method === "pointBuy") {
    state.character.abilities = Object.fromEntries(ABILITIES.map(([key]) => [key, clamp(Number(state.character.abilities[key]) || 8, 8, 15)]));
    trimPointBuyToBudget();
  }
}

function adjustPointBuyAbility(key, delta) {
  const current = Number(state.character.abilities[key]) || 8;
  const next = clamp(current + delta, 8, 15);
  if (next === current) return;
  if (delta > 0 && pointBuySpent() + pointBuyCost(next) - pointBuyCost(current) > POINT_BUY_BUDGET) return;
  state.character.abilities[key] = next;
}

function trimPointBuyToBudget() {
  while (pointBuySpent() > POINT_BUY_BUDGET) {
    const highest = ABILITIES
      .map(([key]) => key)
      .filter((key) => state.character.abilities[key] > 8)
      .sort((a, b) => state.character.abilities[b] - state.character.abilities[a])[0];
    if (!highest) break;
    state.character.abilities[highest] -= 1;
  }
}

function pointBuySpent() {
  return ABILITIES.reduce((total, [key]) => total + pointBuyCost(state.character.abilities[key]), 0);
}

function pointBuyCost(score) {
  return POINT_BUY_COSTS[clamp(Number(score) || 8, 8, 15)] ?? 0;
}

function updateChoiceList(listName, value, checked) {
  if (listName === "savingThrows") return;
  const current = state.character[listName] ?? [];
  const next = checked ? [...current, value] : current.filter((item) => item !== value);
  state.character[listName] = [...new Set(next)];
}

function spellIndex(spellName) {
  return String(spellName)
    .trim()
    .toLowerCase()
    .replaceAll("'", "")
    .replaceAll("/", " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

function classSavingThrows() {
  const apiSaves = state.api.classes[state.character.class]?.saving_throws;
  if (Array.isArray(apiSaves) && apiSaves.length) {
    return apiSaves.map((save) => save.index).filter(Boolean);
  }
  return [];
}

function classFeatureSummary() {
  const className = state.character.class;
  if (className === "monk") return "- Martial Arts\n- Ki\n- Unarmored Movement";
  if (classHasSpellList(className)) return "- Spellcasting\n- Class features by level";
  return "- Class features by level";
}

function setByPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  while (parts.length > 1) {
    const part = parts.shift();
    cursor[part] ??= {};
    cursor = cursor[part];
  }
  cursor[parts[0]] = value;
}

function mod(key) {
  return state.derived?.abilityModifiers?.[key] ?? Math.floor((abilityScore(key) - 10) / 2);
}

function abilityScore(key) {
  if (state.derived?.abilityScores?.[key] != null) return state.derived.abilityScores[key];
  return clamp((Number(state.character.abilities[key]) || 10) + abilityBonusFromChoices(key), 1, 30);
}

function abilityBonusFromChoices(key) {
  return Object.entries(state.character.asiChoices ?? {}).reduce((total, [ruleId, choice]) => {
    const normalized = normalizedAsiChoice({ id: ruleId }, choice);
    if (normalized.mode !== "asi") return total;
    if (normalized.pattern === "plus2" && normalized.ability1 === key) return total + 2;
    if (normalized.pattern === "plus1plus1" && (normalized.ability1 === key || normalized.ability2 === key)) return total + 1;
    return total;
  }, 0);
}

function abilityScoreBeforeAsiRule(key, ruleId) {
  return clamp((Number(state.character.abilities[key]) || 10) + Object.entries(state.character.asiChoices ?? {}).reduce((total, [id, choice]) => {
    if (id === ruleId) return total;
    const normalized = normalizedAsiChoice({ id }, choice);
    if (normalized.mode !== "asi") return total;
    if (normalized.pattern === "plus2" && normalized.ability1 === key) return total + 2;
    if (normalized.pattern === "plus1plus1" && (normalized.ability1 === key || normalized.ability2 === key)) return total + 1;
    return total;
  }, 0), 1, 30);
}

function skillBonus(name) {
  if (state.derived?.skillBonuses?.[name] != null) return state.derived.skillBonuses[name];
  const ability = SKILLS.find(([skill]) => skill === name)?.[1] ?? "dex";
  return mod(ability) + (state.character.skillProficiencies.includes(name) ? proficiency() : 0) + skillChoiceBonus(name);
}

function skillChoiceBonus(name) {
  const choices = state.character.classFeatureChoices ?? {};
  if (state.character.class === "druid" && choices["primal-order"] === "magician") {
    const target = choices["magician-skill"];
    if (target && slugifyName(name) === target) return Math.max(1, mod("wis"));
  }
  return 0;
}

function proficiency() {
  return state.derived?.proficiencyBonus ?? proficiencyForLevel(state.character.level);
}

function proficiencyForLevel(level) {
  return Math.ceil(level / 4) + 1;
}

function hitDie() {
  return state.api.classes[state.character.class]?.hit_die ?? 8;
}

function casterLevel() {
  const className = state.character.class;
  const progression = state.api.classes[className]?.casterProgression;
  if (!classHasSpellList(className)) return 0;
  if (progression === "artificer") return Math.max(0, Math.ceil(state.character.level / 2));
  if (progression === "pact") return state.character.level;
  if (HALF_CASTER.has(className)) return Math.max(0, Math.floor(state.character.level / 2));
  if (className === "warlock") return state.character.level;
  return state.character.level;
}

function spellAbility() {
  const apiAbility = state.api.classes[state.character.class]?.spellcastingAbility;
  if (apiAbility) return apiAbility;
  const ability = {
    bard: "cha",
    cleric: "wis",
    druid: "wis",
    paladin: "cha",
    ranger: "wis",
    sorcerer: "cha",
    warlock: "cha",
    wizard: "int",
    monk: "wis",
  };
  return ability[state.character.class] ?? "int";
}

function spellDeck() {
  return CLASS_DECKS[state.character.class] ?? "arcane";
}

function deckLabel(deck) {
  const labels = {
    arcane: "Arcane",
    bard: "Bard",
    cleric: "Cleric",
    druid: "Druid",
    paladin: "Paladin",
    ranger: "Ranger",
    warlock: "Warlock",
  };
  return labels[deck] ?? "Arcane";
}

function signed(value) {
  return value >= 0 ? `+${value}` : String(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function titleCase(value) {
  return String(value)
    .split(/[-\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ordinalSuffix(value) {
  if (!Number.isFinite(value)) return "";
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  const mod10 = value % 10;
  if (mod10 === 1) return "st";
  if (mod10 === 2) return "nd";
  if (mod10 === 3) return "rd";
  return "th";
}

function classHasSpellList(className) {
  return (state.api.classSpells?.[className] ?? []).length > 0;
}

function slugifyName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replaceAll("'", "")
    .replaceAll("/", " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function skillNameFromSlug(value) {
  const normalized = String(value).toLowerCase();
  return SKILLS.find(([name]) => slugifyName(name) === slugifyName(normalized))?.[0] ?? titleCase(normalized);
}

function spellSchoolName(school) {
  const schools = {
    A: "Abjuration",
    C: "Conjuration",
    D: "Divination",
    E: "Enchantment",
    I: "Illusion",
    N: "Necromancy",
    T: "Transmutation",
    V: "Evocation",
  };
  return schools[school] ?? school ?? "";
}

function format5etoolsTime(time) {
  const first = Array.isArray(time) ? time[0] : time;
  if (!first) return "-";
  return `${first.number ?? 1} ${first.unit ?? ""}`.trim();
}

function format5etoolsRange(range) {
  const distance = range?.distance;
  if (!distance) return "-";
  if (distance.type === "self") return "Self";
  if (distance.type === "touch") return "Touch";
  if (distance.type === "sight") return "Sight";
  if (distance.type === "unlimited") return "Unlimited";
  if (Number.isFinite(distance.amount)) return `${distance.amount} ${distance.type}`;
  return titleCase(distance.type ?? range.type ?? "-");
}

function format5etoolsComponents(components) {
  if (!components) return "-";
  const parts = [];
  if (components.v) parts.push("V");
  if (components.s) parts.push("S");
  if (components.m) parts.push("M");
  return parts.join(", ");
}

function format5etoolsDuration(duration) {
  const first = Array.isArray(duration) ? duration[0] : duration;
  if (!first) return "-";
  if (first.type === "instant") return "Instantaneous";
  if (first.type === "permanent") return "Permanent";
  if (first.type === "special") return "Special";
  if (first.type === "timed") {
    const amount = first.duration?.amount ?? 1;
    const type = first.duration?.type ?? "";
    return `${first.concentration ? "Concentration, up to " : ""}${amount} ${type}`.trim();
  }
  return titleCase(first.type);
}

function entriesToText(entries) {
  return (entries ?? [])
    .map(entryToText)
    .filter(Boolean)
    .join("\n\n");
}

function entryToText(entry) {
  if (typeof entry === "string") return clean5etoolsText(entry);
  if (Array.isArray(entry)) return entry.map(entryToText).filter(Boolean).join("\n");
  if (!entry || typeof entry !== "object") return "";
  if (entry.type === "entries") {
    const title = entry.name ? `${clean5etoolsText(entry.name)}\n` : "";
    return `${title}${entriesToText(entry.entries)}`.trim();
  }
  if (entry.type === "list") return (entry.items ?? []).map((item) => `- ${entryToText(item)}`).join("\n");
  if (entry.type === "item") return clean5etoolsText(entry.name ?? entry.entry ?? "");
  if (entry.type === "table") {
    const rows = (entry.rows ?? []).map((row) => Array.isArray(row) ? row.map(entryToText).join(" | ") : entryToText(row));
    return [entry.caption, ...rows].filter(Boolean).map(clean5etoolsText).join("\n");
  }
  return clean5etoolsText(entry.name ?? "");
}

function clean5etoolsText(value) {
  return String(value ?? "")
    .replace(/\{@(?:spell|item|condition|skill|sense|variantrule|filter|hazard|scaledamage|damage|feat|action|book)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
    .replace(/\{@(?:dice|hit|d20|chance)\s+([^|}]+)(?:\|[^}]*)?}/g, "$1")
    .replace(/\{@i\s+([^}]+)}/g, "$1")
    .replace(/\{@b\s+([^}]+)}/g, "$1")
    .replace(/\{@[^}]+\}/g, "")
    .trim();
}

function paragraphs(value) {
  return String(value || "")
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
