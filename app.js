const API_5E = "https://www.dnd5eapi.co/api/2014";
const API_OPEN5E = "https://api.open5e.com/v2";

const ABILITIES = [
  ["str", "Strength"],
  ["dex", "Dexterity"],
  ["con", "Constitution"],
  ["int", "Intelligence"],
  ["wis", "Wisdom"],
  ["cha", "Charisma"],
];

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

const SPELLCASTERS = new Set(["bard", "cleric", "druid", "sorcerer", "warlock", "wizard", "paladin", "ranger"]);
const HALF_CASTER = new Set(["paladin", "ranger"]);
const PREPARED_CASTERS = new Set(["cleric", "druid", "paladin", "wizard"]);
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

const FALLBACK_SPELL_OPTIONS = [
  { name: "Guidance", level: 0, classes: ["cleric", "druid"] },
  { name: "Druidcraft", level: 0, classes: ["druid"] },
  { name: "Light", level: 0, classes: ["bard", "cleric", "sorcerer", "wizard"] },
  { name: "Mending", level: 0, classes: ["bard", "cleric", "druid", "sorcerer", "wizard"] },
  { name: "Poison Spray", level: 0, classes: ["druid", "sorcerer", "warlock", "wizard"] },
  { name: "Produce Flame", level: 0, classes: ["druid"] },
  { name: "Resistance", level: 0, classes: ["cleric", "druid"] },
  { name: "Shillelagh", level: 0, classes: ["druid"] },
  { name: "Thorn Whip", level: 0, classes: ["druid"] },
  { name: "Fire Bolt", level: 0, classes: ["sorcerer", "wizard"] },
  { name: "Mage Hand", level: 0, classes: ["bard", "sorcerer", "warlock", "wizard"] },
  { name: "Sacred Flame", level: 0, classes: ["cleric"] },
  { name: "Charm Person", level: 1, classes: ["bard", "druid", "sorcerer", "warlock", "wizard"] },
  { name: "Create or Destroy Water", level: 1, classes: ["cleric", "druid"] },
  { name: "Cure Wounds", level: 1, classes: ["bard", "cleric", "druid", "paladin", "ranger"] },
  { name: "Detect Magic", level: 1, classes: ["bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "wizard"] },
  { name: "Detect Poison and Disease", level: 1, classes: ["cleric", "druid", "paladin", "ranger"] },
  { name: "Entangle", level: 1, classes: ["druid"] },
  { name: "Faerie Fire", level: 1, classes: ["bard", "druid"] },
  { name: "Fog Cloud", level: 1, classes: ["druid", "ranger", "sorcerer", "wizard"] },
  { name: "Goodberry", level: 1, classes: ["druid", "ranger"] },
  { name: "Healing Word", level: 1, classes: ["bard", "cleric", "druid"] },
  { name: "Jump", level: 1, classes: ["druid", "ranger", "sorcerer", "wizard"] },
  { name: "Longstrider", level: 1, classes: ["bard", "druid", "ranger", "wizard"] },
  { name: "Purify Food and Drink", level: 1, classes: ["cleric", "druid", "paladin"] },
  { name: "Speak with Animals", level: 1, classes: ["bard", "druid", "ranger"] },
  { name: "Thunderwave", level: 1, classes: ["bard", "druid", "sorcerer", "wizard"] },
  { name: "Shield", level: 1, classes: ["sorcerer", "wizard"] },
  { name: "Burning Hands", level: 1, classes: ["sorcerer", "wizard"] },
  { name: "Fireball", level: 3, classes: ["sorcerer", "wizard"] },
  { name: "Animate Objects", level: 5, classes: ["bard", "sorcerer", "wizard"] },
];

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
  ["features", "Notas"],
];

const defaultState = {
  step: "lineage",
  tab: "summary",
  dataStatus: "local",
  selectedSpell: "",
  api: { classes: {}, levels: {}, races: {}, spells: [], classSpells: {}, spellDetails: {} },
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

const els = {
  form: document.querySelector("#builderForm"),
  stepNav: document.querySelector("#stepNav"),
  sheetTabs: document.querySelector("#sheetTabs"),
  sheetView: document.querySelector("#sheetView"),
  saveButton: document.querySelector("#saveButton"),
  characterMenuButton: document.querySelector("#characterMenuButton"),
  characterMenu: document.querySelector("#characterMenu"),
  menuBackdrop: document.querySelector("#menuBackdrop"),
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
  localStorage.setItem("dnd-sheet-builder", JSON.stringify(state));
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
}

function syncActiveCharacter() {
  state.character.id ??= state.activeCharacterId ?? crypto.randomUUID();
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
}

function createStartingCharacter() {
  const character = structuredClone(defaultState.character);
  character.id = crypto.randomUUID();
  character.name = "Nova Ficha";
  character.level = 1;
  character.hp = 10;
  character.armorClass = 10;
  character.speed = 30;
  character.race = "human";
  character.subrace = "Human";
  character.class = "fighter";
  character.background = "Acolyte";
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
  normalizeCharacterState();
  persist();
  render();
}

async function hydrateApiData() {
  state.dataStatus = "carregando APIs";
  renderChrome();
  const [classesResult, spellsResult] = await Promise.allSettled([
    fetchJson(`${API_5E}/classes`),
    fetchJson(`${API_OPEN5E}/spells/?limit=30`),
  ]);

  if (classesResult.status === "fulfilled") {
    state.api.classList = classesResult.value.results ?? [];
  }

  if (spellsResult.status === "fulfilled") {
    state.api.spells = (spellsResult.value.results ?? []).map((spell) => spell.name).filter(Boolean).slice(0, 30);
  }

  try {
    if (classesResult.status === "fulfilled") {
      await loadClassData(state.character.class);
    }
    const loadedOpen5e = spellsResult.status === "fulfilled";
    const loaded5e = classesResult.status === "fulfilled" && Boolean(state.api.levels[state.character.class]);
    if (loaded5e && loadedOpen5e) state.dataStatus = "API 5e + Open5e";
    else if (loaded5e) state.dataStatus = "API 5e";
    else if (loadedOpen5e) state.dataStatus = "Open5e + local";
    else state.dataStatus = "local fallback";
    normalizeCharacterState();
    persist();
  } catch {
    state.dataStatus = "local fallback";
  }
}

async function loadClassData(className) {
  if (!className) return;
  if (state.api.classes[className]) {
    await loadClassSpellOptions(className);
    return;
  }
  try {
    const [details, levels] = await Promise.all([
      fetchJson(`${API_5E}/classes/${className}`),
      fetchJson(`${API_5E}/classes/${className}/levels`),
    ]);
    state.api.classes[className] = details;
    state.api.levels[className] = levels;
    await loadClassSpellOptions(className);
  } catch {
    state.dataStatus = "local fallback";
  }
}

async function loadRaceData(raceName) {
  const index = String(raceName).toLowerCase();
  if (!index || index === "turtle" || state.api.races[index]) return;
  try {
    const [details, subraces] = await Promise.all([
      fetchJson(`${API_5E}/races/${index}`),
      fetchJson(`${API_5E}/races/${index}/subraces`),
    ]);
    state.api.races[index] = {
      details,
      subraces: (subraces.results ?? []).map((subrace) => subrace.name).filter(Boolean),
    };
  } catch {
    state.api.races[index] = { subraces: [] };
  }
}

async function loadClassSpellOptions(className) {
  if (!SPELLCASTERS.has(className)) return;
  if (Array.isArray(state.api.classSpells[className]) && state.api.classSpells[className].length > 0) return;
  try {
    const spells = await fetchJson(`${API_5E}/classes/${className}/spells`);
    const details = await Promise.allSettled(
      (spells.results ?? []).map((spell) => fetchJson(`${API_5E}${spell.url}`))
    );
    state.api.classSpells[className] = details
      .filter((result) => result.status === "fulfilled")
      .map((result) => ({ name: result.value.name, level: result.value.level }))
      .filter((spell) => spell.name && Number.isFinite(spell.level));
  } catch {
    state.api.classSpells[className] = [];
  }
}

async function loadSpellDetails(spellName) {
  if (!spellName || state.api.spellDetails[spellName]) return;
  const index = spellIndex(spellName);

  try {
    const detail = await fetchJson(`${API_5E}/spells/${index}`);
    state.api.spellDetails[spellName] = normalizeDndSpell(detail, spellName);
    persist();
    return;
  } catch {
    // Open5e is used as a secondary source because some spells are not in the SRD API.
  }

  try {
    const search = await fetchJson(`${API_OPEN5E}/spells/?search=${encodeURIComponent(spellName)}&limit=12`);
    const detail = (search.results ?? []).find((spell) => String(spell.name).toLowerCase() === spellName.toLowerCase());
    if (!detail) throw new Error("Spell not found");
    state.api.spellDetails[spellName] = normalizeOpen5eSpell(detail, spellName);
  } catch {
    state.api.spellDetails[spellName] = fallbackSpell(spellName);
  }
  persist();
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

function normalizeDndSpell(spell, fallbackName) {
  const school = spell.school?.name ? `${spell.school.name} ` : "";
  const levelLine = spell.level === 0 ? `${school}cantrip` : `${spell.level}${ordinalSuffix(spell.level)}-level ${school}`.trim();
  return {
    name: spell.name ?? fallbackName,
    level: spell.level,
    levelLine,
    castingTime: spell.casting_time,
    range: spell.range,
    components: (spell.components ?? []).join(", "),
    duration: spell.duration,
    material: spell.material ?? "",
    description: (spell.desc ?? []).join("\n\n"),
    higherLevel: (spell.higher_level ?? []).join("\n\n"),
  };
}

function normalizeOpen5eSpell(spell, fallbackName) {
  const school = spell.school ? `${spell.school} ` : "";
  const level = Number(spell.level);
  const levelLine = Number.isFinite(level)
    ? level === 0 ? `${school}cantrip` : `${level}${ordinalSuffix(level)}-level ${school}`.trim()
    : "Spell";
  return {
    name: spell.name ?? fallbackName,
    level: Number.isFinite(level) ? level : undefined,
    levelLine,
    castingTime: spell.casting_time,
    range: spell.range,
    components: Array.isArray(spell.components) ? spell.components.join(", ") : spell.components,
    duration: spell.duration,
    material: typeof spell.material === "string" ? spell.material : "",
    description: spell.desc ?? spell.description ?? "",
    higherLevel: spell.higher_level ?? spell.higher_level_text ?? "",
  };
}

function fallbackSpell(spellName) {
  if (spellName.toLowerCase() === "elementalism") {
    return {
      name: "Elementalism",
      level: 0,
      levelLine: "Transmutation cantrip",
      castingTime: "1 action",
      range: "30 feet",
      components: "V, S",
      duration: "Instantaneous",
      material: "",
      description: "Manipule um pequeno efeito elemental apropriado para a cena. Esta magia ainda depende da fonte escolhida pela mesa, entao revise o texto oficial antes de publicar a ficha final.",
      higherLevel: "",
    };
  }

  return {
    name: spellName,
    level: undefined,
    levelLine: "Spell",
    castingTime: "-",
    range: "-",
    components: "-",
    duration: "-",
    material: "",
    description: "Descricao indisponivel nas APIs configuradas. Mantenha a magia na lista e adicione o texto oficial quando a fonte da campanha estiver definida.",
    higherLevel: "",
  };
}

function render() {
  renderChrome();
  renderCharacterMenu();
  renderSteps();
  renderForm();
  renderTabs();
  renderSheet();
}

function renderChrome() {
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
    </div>
    <div class="menu-current">
      <span>Nivel ${state.character.level}</span>
      <strong>${titleCase(state.character.subrace || state.character.race)} ${titleCase(state.character.class)}</strong>
    </div>
    <div class="roster-list menu-roster">
      ${state.characters.map((character) => `
        <button type="button" class="roster-button ${character.id === state.activeCharacterId ? "active" : ""}" data-menu-roster-id="${character.id}">
          <strong>${escapeHtml(character.name || "Nova Ficha")}</strong>
          <span>${titleCase(character.subrace || character.race)} ${titleCase(character.class)} ${character.level}</span>
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
    levelUpCharacter();
    persist();
    render();
  });
  els.characterMenu.querySelectorAll("[data-menu-roster-id]").forEach((button) => {
    button.addEventListener("click", () => {
      switchCharacter(button.dataset.menuRosterId);
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
  els.stepNav.innerHTML = STEPS.map(([id, label]) => (
    `<button type="button" class="step-button ${state.step === id ? "active" : ""}" data-step="${id}">${label}</button>`
  )).join("");
  els.stepNav.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
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
  const renderers = {
    lineage: renderLineageForm,
    abilities: renderAbilitiesForm,
    choices: renderChoicesForm,
    leveling: renderLevelingForm,
  };
  els.form.innerHTML = `${renderNameField()}${renderers[state.step]()}`;
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
  const subraceOptions = subracesFor(c.race);
  return `
    <div class="form-grid">
      ${selectField("class", "Classe", c.class, CLASSES.map((item) => [item, titleCase(item)]))}
      ${selectField("race", "Raca / especie", c.race, [...RACES, "Turtle"].map((item) => [item, titleCase(item)]))}
      ${selectField("subrace", "Subraca", c.subrace ?? subraceOptions[0], subraceOptions.map((item) => [item, item]))}
      ${selectField("background", "Background", c.background, BACKGROUNDS.map((item) => [item, item]))}
      ${selectField("alignment", "Alinhamento", c.alignment, ["Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"].map((item) => [item, item]))}
    </div>
    <p class="hint">A classe alimenta hit dice, proficiencia, ataques sugeridos, magia e a lista de escolhas por nivel. Quando a API 5e responder, os niveis vem dela.</p>
    ${navButtons()}
  `;
}

function renderAbilitiesForm() {
  const classSaves = classSavingThrows();
  return `
    <div class="ability-grid">
      ${ABILITIES.map(([key, label]) => numberField(`abilities.${key}`, label, state.character.abilities[key], 1, 30)).join("")}
    </div>
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

function renderChoicesForm() {
  const classSkill = classSkillRule();
  const selected = state.character.classSkillChoices ?? [];
  const selectedCount = selected.length;
  return `
    <fieldset class="choice-group">
      <legend>Skills da classe</legend>
      <p class="choice-counter ${selectedCount === classSkill.choose ? "complete" : selectedCount > classSkill.choose ? "invalid" : ""}">
        ${selectedCount}/${classSkill.choose} escolhidas
      </p>
      <div class="choice-list">
        ${classSkill.options.map((name) => checkbox("classSkillChoices", name, name, selected.includes(name), selectedCount >= classSkill.choose && !selected.includes(name))).join("")}
      </div>
    </fieldset>
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

function renderLevelingForm() {
  const items = getLevelPlan();
  const spellRule = spellChoiceRule();
  const selectedSpellCount = state.character.spells.length;
  const spellLimitReached = spellRule.totalMax > 0 && selectedSpellCount >= spellRule.totalMax;
  return `
    <div class="level-list">
      ${items.map((item) => `
        <article class="level-card">
          <h3>Nivel ${item.level}: ${item.title}</h3>
          <p>${item.summary}</p>
          ${item.choices.length ? `<ul>${item.choices.map((choice) => `<li>${choice}</li>`).join("")}</ul>` : ""}
        </article>
      `).join("")}
    </div>
    <fieldset class="choice-group">
      <legend>Magias conhecidas / preparadas</legend>
      <p class="choice-counter ${selectedSpellCount === spellRule.totalMax ? "complete" : selectedSpellCount > spellRule.totalMax ? "invalid" : ""}">
        ${selectedSpellCount}/${spellRule.totalMax} ${spellRule.label}
      </p>
      <p class="hint">${spellRule.hint}</p>
      ${renderSpellChoiceGroups(spellRule, spellLimitReached)}
    </fieldset>
    <div class="field">
      <label for="notes">Features e notas</label>
      <textarea id="notes" data-path="notes">${escapeHtml(state.character.notes)}</textarea>
    </div>
    ${navButtons()}
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

function selectField(path, label, value, options) {
  const id = path.replace(".", "-");
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <select id="${id}" data-path="${path}">
        ${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${String(optionValue).toLowerCase() === String(value).toLowerCase() ? "selected" : ""}>${optionLabel}</option>`).join("")}
      </select>
    </div>
  `;
}

function checkbox(path, value, label, checked, disabled = false, locked = false) {
  return `<label class="${disabled ? "disabled" : ""} ${locked ? "locked" : ""}"><input type="checkbox" data-list="${path}" value="${escapeHtml(value)}" ${checked ? "checked" : ""} ${disabled || locked ? "disabled" : ""} /> ${label}</label>`;
}

function navButtons() {
  const index = STEPS.findIndex(([id]) => id === state.step);
  return `
    <div class="nav-row">
      <button type="button" class="secondary-button" data-move="${Math.max(0, index - 1)}">Voltar</button>
      <button type="button" class="primary-button" data-move="${Math.min(STEPS.length - 1, index + 1)}">Continuar</button>
    </div>
  `;
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
    input.addEventListener("input", async () => {
      setByPath(state.character, input.dataset.path, input.type === "number" ? Number(input.value) : input.value);
      const needsFullRender = input.dataset.path === "class" || input.dataset.path === "race" || input.dataset.path === "subrace";
      if (input.dataset.path === "class") {
        await loadClassData(input.value);
        state.character.savingThrows = defaultSaves(input.value);
        state.character.classSkillChoices = [];
      }
      if (input.dataset.path === "race") {
        await loadRaceData(input.value);
        state.character.subrace = defaultSubrace(input.value);
      }
      normalizeCharacterState();
      persist();
      renderChrome();
      if (needsFullRender) render();
      else renderSheet();
    });
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
      state.step = STEPS[Number(button.dataset.move)][0];
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

function renderSheet() {
  const renderers = {
    summary: renderSummarySheet,
    skills: renderSkillsSheet,
    attacks: renderAttacksSheet,
    spells: renderSpellsSheet,
    features: renderFeaturesSheet,
  };
  els.sheetView.innerHTML = renderers[state.tab]();
  bindSheetEvents();
}

function bindSheetEvents() {
  els.sheetView.querySelectorAll("[data-spell-name]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedSpell = button.dataset.spellName;
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
}

function renderSummarySheet() {
  const c = state.character;
  return `
    <div class="pill-row">
      <div class="cream-pill">${escapeHtml(c.name)}</div>
      <div class="cream-pill">${titleCase(c.class)} ${c.level}</div>
    </div>
    <div class="hero-stats">
      ${bigStat("Initiative", signed(mod("dex")))}
      <div class="hp-orb"><span>HP</span><strong>${c.hp}</strong></div>
      ${bigStat("Speed", c.speed)}
    </div>
    <div class="small-grid">
      ${smallStat("Hit Dice", `${c.level}d${hitDie()}`)}
      ${smallStat("Armor Class", c.armorClass)}
      ${smallStat("Proficiency", signed(proficiency()))}
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
  const c = state.character;
  const attackAbility = c.class === "monk" || c.class === "rogue" ? "dex" : "str";
  return `
    <div class="metric-row">
      ${smallStat("Proficiency", signed(proficiency()))}
      ${smallStat(titleCase(attackAbility), signed(mod(attackAbility)))}
      ${smallStat(c.class === "monk" ? "Ki Points" : "Level", c.class === "monk" ? c.level : c.level)}
    </div>
    <div class="sheet-view">
      ${c.attacks.map((attack) => `
        <div class="attack-row">
          <div class="orange-pill attack-name">${escapeHtml(attack.name)}</div>
          <div class="orange-pill">${escapeHtml(attack.range)}</div>
          <div class="orange-pill">${escapeHtml(attack.type)}</div>
          <span class="delete-dot">x</span>
          <div class="pink-pill">${signed(proficiency() + mod(attackAbility))}</div>
          <div class="pink-pill">${escapeHtml(attack.damage)}${signed(mod(attackAbility))}</div>
        </div>
      `).join("") || `<div class="empty-state">Adicione ataques na etapa Escolhas.</div>`}
      <button type="button" class="mini-button">New</button>
    </div>
  `;
}

function renderSpellsSheet() {
  const spells = state.character.spells.length ? state.character.spells : ["Elementalism"];
  const selected = state.selectedSpell && spells.includes(state.selectedSpell) ? state.selectedSpell : "";
  return `
    <div class="metric-row">
      ${smallStat("C Level", casterLevel())}
      ${smallStat("Spell Attack", signed(proficiency() + mod(spellAbility())))}
      ${smallStat("Spell DC", 8 + proficiency() + mod(spellAbility()))}
    </div>
    <div class="spell-strip">Cantrips</div>
    ${spells.map((spell) => `<button type="button" class="purple-strip spell-button ${spell === selected ? "active" : ""}" data-spell-name="${escapeHtml(spell)}">${escapeHtml(spell)}</button>`).join("")}
    ${selected ? renderSpellCard(selected) : `<div class="empty-state">Clique no nome de uma magia para abrir a descricao.</div>`}
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
  const c = state.character;
  const traits = RACE_TRAITS[String(c.race).toLowerCase()] ?? (String(c.race).toLowerCase() === "turtle" ? ["Natural Armor", "Shell Defense", "Survival Instinct"] : []);
  return `
    <div class="info-grid">
      <div class="info-card full"><h3>Class</h3><div>${titleCase(c.class)} ${c.level}</div></div>
      <div class="info-card"><h3>Race</h3><div>${escapeHtml(c.subrace || titleCase(c.race))}</div></div>
      <div class="info-card"><h3>Background</h3><div>${escapeHtml(c.background)}</div></div>
      <div class="info-card"><h3>Alignment</h3><div>${escapeHtml(c.alignment)}</div></div>
      <div class="info-card"><h3>Experience</h3><div>${c.experience}</div></div>
    </div>
    <div class="feature-box"><strong>Features</strong>
${traits.map((trait) => `- ${trait}`).join("\n")}
${classFeatureSummary()}

${escapeHtml(c.notes)}</div>
  `;
}

function bigStat(label, value) {
  return `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function smallStat(label, value) {
  return `<div class="small-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function abilityCard(key, label) {
  const save = mod(key) + (state.character.savingThrows.includes(key) ? proficiency() : 0);
  return `
    <article class="ability-card">
      <h3>${label}</h3>
      <div class="ability-values">
        <div><span>Score</span><strong>${state.character.abilities[key]}</strong></div>
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

  return Array.from({ length: state.character.level }, (_, index) => {
    const level = index + 1;
    return {
      level,
      title: `${titleCase(state.character.class)} progression`,
      summary: `Proficiency ${signed(proficiencyForLevel(level))}.`,
      choices: fallbackChoicesForLevel(state.character.class, level),
    };
  });
}

function classSpecificChoices(level) {
  const details = [];
  if (level.class_specific?.ki_points) details.push(`Ki Points: ${level.class_specific.ki_points}`);
  if (level.spellcasting) details.push(`Spell slots e magias liberadas neste nivel`);
  if (level.ability_score_bonuses) details.push("Escolha ASI ou feat, conforme a mesa permitir");
  return details;
}

function fallbackChoicesForLevel(className, level) {
  const choices = [];
  if (level === 1) choices.push("Escolher proficiencias iniciais", "Escolher equipamento inicial");
  if (["bard", "cleric", "druid", "sorcerer", "warlock", "wizard"].includes(className) && level === 1) choices.push("Escolher cantrips e magias iniciais");
  if (["paladin", "ranger"].includes(className) && level === 2) choices.push("Escolher estilo de luta e magias");
  if ([3].includes(level)) choices.push("Escolher subclasse / caminho");
  if ([4, 8, 12, 16, 19].includes(level)) choices.push("Escolher ASI ou feat");
  if (className === "monk" && level >= 2) choices.push(`Ki Points: ${level}`);
  return choices;
}

function spellOptions() {
  if (!SPELLCASTERS.has(state.character.class)) return state.character.spells;
  const legalOptions = legalSpellOptions();
  return [...new Set([...state.character.spells.filter((name) => legalSpellNames().has(name)), ...legalOptions.map((spell) => spell.name)])].slice(0, 60);
}

function renderSpellChoiceGroups(spellRule, spellLimitReached) {
  const legalByName = new Map(legalSpellOptions().map((spell) => [spell.name, spell]));
  const selectedLegal = state.character.spells
    .filter((name) => legalSpellNames().has(name))
    .map((name) => legalByName.get(name) ?? spellFromKnownData(name))
    .filter((spell) => spell?.name && Number.isFinite(spell.level));
  const grouped = groupBySpellLevel([...selectedLegal, ...legalByName.values()]);

  if (!grouped.length) return `<div class="empty-state">Nenhuma magia disponivel para ${titleCase(state.character.class)} neste nivel.</div>`;

  return grouped.map(([level, spells]) => `
    <section class="spell-choice-group">
      <h3>${spellLevelLabel(level)}</h3>
      <div class="choice-list">
        ${spells.map((spell) => checkbox("spells", spell.name, spell.name, state.character.spells.includes(spell.name), spellRule.totalMax === 0 || (spellLimitReached && !state.character.spells.includes(spell.name)))).join("")}
      </div>
    </section>
  `).join("");
}

function legalSpellOptions() {
  const className = state.character.class;
  const maxLevel = maxSpellLevelAvailable();
  const rawClassSpells = state.api.classSpells?.[className] ?? [];
  const normalizedClassSpells = rawClassSpells
    .map((spell) => typeof spell === "string" ? spellFromKnownData(spell) : spell)
    .filter((spell) => spell?.name && Number.isFinite(spell.level));

  const source = normalizedClassSpells.length
    ? normalizedClassSpells
    : FALLBACK_SPELL_OPTIONS.filter((spell) => spell.classes.includes(className));

  return source
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

function legalSpellNames() {
  return new Set(legalSpellOptions().map((spell) => spell.name));
}

function spellFromKnownData(name) {
  const detail = state.api.spellDetails?.[name];
  if (detail && Number.isFinite(detail.level)) return { name, level: detail.level };
  return FALLBACK_SPELL_OPTIONS.find((spell) => spell.name === name) ?? { name, level: Infinity };
}

function classSkillRule() {
  const apiChoice = state.api.classes[state.character.class]?.proficiency_choices?.find((choice) =>
    choice.type === "proficiencies" && optionNames(choice).some((name) => name.startsWith("Skill:"))
  );

  if (apiChoice) {
    return {
      choose: apiChoice.choose,
      options: optionNames(apiChoice).filter((name) => name.startsWith("Skill:")).map((name) => name.replace("Skill: ", "")),
    };
  }

  return CLASS_SKILLS[state.character.class] ?? CLASS_SKILLS.fighter;
}

function subracesFor(raceName) {
  const key = String(raceName);
  const apiSubraces = state.api.races[key.toLowerCase()]?.subraces ?? [];
  const fallback = SUBRACES[key] ?? SUBRACES[key.toLowerCase()] ?? [titleCase(key)];
  return apiSubraces.length ? apiSubraces : fallback;
}

function defaultSubrace(raceName) {
  return subracesFor(raceName)[0] ?? titleCase(raceName);
}

function levelUpCharacter() {
  if (state.character.level >= 20) return;
  state.character.level += 1;
  state.character.hp += Math.max(1, Math.ceil(hitDie() / 2) + 1 + mod("con"));
  normalizeCharacterState();
}

function normalizeSubrace() {
  const options = subracesFor(state.character.race);
  if (!state.character.subrace || !options.includes(state.character.subrace)) state.character.subrace = options[0];
}

function spellChoiceRule() {
  const className = state.character.class;
  const levelRow = currentLevelRow();
  const spellcasting = levelRow?.spellcasting ?? fallbackSpellcasting(className, state.character.level);
  const cantrips = spellcasting.cantrips_known ?? 0;

  if (!SPELLCASTERS.has(className) || casterLevel() === 0) {
    return {
      cantrips,
      spellsMax: 0,
      totalMax: 0,
      label: "permitidas pela classe",
      hint: "Esta classe nao recebe conjuracao pela API 5e 2014 neste nivel.",
    };
  }

  if (PREPARED_CASTERS.has(className)) {
    const prepared = preparedSpellLimit(className);
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
    hint: `${titleCase(className)} conhece ${known} magia(s) e ${cantrips} cantrip(s) neste nivel, conforme a tabela da API.`,
  };
}

function maxSpellLevelAvailable() {
  const className = state.character.class;
  if (!SPELLCASTERS.has(className) || casterLevel() === 0) return 0;
  const spellcasting = currentLevelRow()?.spellcasting;
  if (spellcasting) {
    for (let level = 9; level >= 1; level -= 1) {
      if ((spellcasting[`spell_slots_level_${level}`] ?? 0) > 0) return level;
    }
    return (spellcasting.cantrips_known ?? 0) > 0 ? 0 : 0;
  }
  return fallbackMaxSpellLevel(className, state.character.level);
}

function fallbackMaxSpellLevel(className, level) {
  const characterLevel = Math.max(1, Math.min(20, Number(level) || 1));
  if (className === "paladin" || className === "ranger") return characterLevel < 2 ? 0 : Math.ceil(characterLevel / 4);
  if (className === "warlock") return Math.min(5, Math.ceil(characterLevel / 2));
  return Math.min(9, Math.ceil(characterLevel / 2));
}

function fallbackSpellcasting(className, level) {
  const capped = Math.max(1, Math.min(20, Number(level) || 1));
  const known = {
    bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
    ranger: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
    sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
    warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  };
  const cantrips = {
    bard: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    cleric: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    druid: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    sorcerer: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  };

  return {
    cantrips_known: cantrips[className]?.[capped - 1] ?? 0,
    spells_known: known[className]?.[capped - 1] ?? 0,
  };
}

function preparedSpellLimit(className) {
  const abilityMod = mod(spellAbility());
  if (className === "paladin") return Math.max(1, Math.floor(state.character.level / 2) + abilityMod);
  return Math.max(1, state.character.level + abilityMod);
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
  normalizeSubrace();
  state.character.classSkillChoices ??= deriveClassSkillChoices();
  state.character.savingThrows = classSavingThrows();
  enforceClassSkillLimit();
  syncSkillProficiencies();
  enforceSpellLimit();
}

function deriveClassSkillChoices() {
  const rule = classSkillRule();
  return (state.character.skillProficiencies ?? []).filter((skill) => rule.options.includes(skill)).slice(0, rule.choose);
}

function enforceClassSkillLimit() {
  const rule = classSkillRule();
  state.character.classSkillChoices = [...new Set(state.character.classSkillChoices ?? [])]
    .filter((skill) => rule.options.includes(skill))
    .slice(0, rule.choose);
}

function syncSkillProficiencies() {
  const rule = classSkillRule();
  const existingNonClass = (state.character.skillProficiencies ?? []).filter((skill) => !rule.options.includes(skill));
  state.character.skillProficiencies = [...new Set([...existingNonClass, ...state.character.classSkillChoices])];
}

function enforceSpellLimit() {
  const rule = spellChoiceRule();
  const legalNames = legalSpellNames();
  state.character.spells = [...new Set(state.character.spells ?? [])]
    .filter((name) => legalNames.size === 0 ? true : legalNames.has(name))
    .slice(0, rule.totalMax);
  if (state.selectedSpell && !state.character.spells.includes(state.selectedSpell)) state.selectedSpell = state.character.spells[0] ?? "";
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
  return defaultSaves(state.character.class);
}

function classFeatureSummary() {
  const className = state.character.class;
  if (className === "monk") return "- Martial Arts\n- Ki\n- Unarmored Movement";
  if (SPELLCASTERS.has(className)) return "- Spellcasting\n- Class features by level";
  return "- Class features by level";
}

function setByPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  while (parts.length > 1) {
    cursor = cursor[parts.shift()];
  }
  cursor[parts[0]] = value;
}

function mod(key) {
  return Math.floor(((state.character.abilities[key] ?? 10) - 10) / 2);
}

function skillBonus(name) {
  const ability = SKILLS.find(([skill]) => skill === name)?.[1] ?? "dex";
  return mod(ability) + (state.character.skillProficiencies.includes(name) ? proficiency() : 0);
}

function proficiency() {
  return proficiencyForLevel(state.character.level);
}

function proficiencyForLevel(level) {
  return Math.ceil(level / 4) + 1;
}

function hitDie() {
  return CLASS_HIT_DIE[state.character.class] ?? 8;
}

function casterLevel() {
  const className = state.character.class;
  if (!SPELLCASTERS.has(className)) return 0;
  if (HALF_CASTER.has(className)) return Math.max(0, Math.floor(state.character.level / 2));
  if (className === "warlock") return state.character.level;
  return state.character.level;
}

function spellAbility() {
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
