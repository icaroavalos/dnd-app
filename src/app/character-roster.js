export function createCharacterRoster({
  getState,
  defaultCharacter,
  abilityDefinitions,
  standardArray,
  clone,
  randomUUID,
  defaultSubrace,
  maxLevelOneHp,
  defaultSaves,
  normalizeCharacterState,
  resolveSelectedSpellName,
  knownSheetSpellNames,
  persist,
  render,
  renderCharacterMenu,
}) {
  function ensureRosterState() {
    const state = getState();
    state.character.id ??= state.activeCharacterId ?? randomUUID();
    state.character.subrace ??= defaultSubrace(state.character.race);
    state.characters = Array.isArray(state.characters) ? state.characters : [];
    if (!state.characters.length) state.characters = [clone(state.character)];
    state.activeCharacterId ??= state.character.id;
    const active = state.characters.find((character) => character.id === state.activeCharacterId);
    if (active) state.character = clone(active);
    else {
      state.activeCharacterId = state.characters[0].id;
      state.character = clone(state.characters[0]);
    }
    state.creationComplete = Boolean(state.character.creationComplete ?? state.creationComplete);
    if (state.creationComplete && !state.levelUpMode) state.builderVisible = false;
  }

  function syncActiveCharacter() {
    const state = getState();
    state.character.id ??= state.activeCharacterId ?? randomUUID();
    state.character.creationComplete = Boolean(state.creationComplete || state.character.creationComplete);
    state.activeCharacterId = state.character.id;
    const index = state.characters.findIndex((character) => character.id === state.character.id);
    if (index >= 0) state.characters[index] = clone(state.character);
    else state.characters.push(clone(state.character));
  }

  function createStartingCharacter() {
    const character = clone(defaultCharacter);
    character.id = randomUUID();
    character.name = "Nova Ficha";
    character.level = 1;
    character.abilityMethod = "standard";
    character.abilities = Object.fromEntries(abilityDefinitions.map(([key], index) => [key, standardArray[index]]));
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
    const state = getState();
    syncActiveCharacter();
    const fresh = createStartingCharacter();
    state.character = fresh;
    state.activeCharacterId = fresh.id;
    state.characters.push(clone(fresh));
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
    const state = getState();
    syncActiveCharacter();
    const character = state.characters.find((item) => item.id === characterId);
    if (!character) return;
    state.activeCharacterId = character.id;
    state.character = clone(character);
    state.levelUpMode = false;
    state.creationComplete = Boolean(state.character.creationComplete);
    if (state.creationComplete) state.builderVisible = false;
    normalizeCharacterState();
    state.selectedSpell = resolveSelectedSpellName(state.selectedSpell, knownSheetSpellNames());
    persist();
    render();
  }

  function deleteCharacter(characterId) {
    const state = getState();
    syncActiveCharacter();
    state.characters = state.characters.filter((character) => character.id !== characterId);
    if (!state.characters.length) {
      const fresh = createStartingCharacter();
      state.characters = [clone(fresh)];
      state.character = fresh;
      state.activeCharacterId = fresh.id;
    } else if (state.activeCharacterId === characterId) {
      state.activeCharacterId = state.characters[0].id;
      state.character = clone(state.characters[0]);
    }
    state.deleteConfirmId = null;
    normalizeCharacterState();
    persist();
    render();
  }

  function requestDeleteCharacter(characterId) {
    const state = getState();
    state.deleteConfirmId = characterId;
    renderCharacterMenu();
  }

  function cancelDeleteCharacter() {
    const state = getState();
    state.deleteConfirmId = null;
    renderCharacterMenu();
  }

  return {
    ensureRosterState,
    syncActiveCharacter,
    createStartingCharacter,
    createNewCharacter,
    switchCharacter,
    deleteCharacter,
    requestDeleteCharacter,
    cancelDeleteCharacter,
  };
}
