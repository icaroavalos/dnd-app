export function createApiData({
  getState,
  dataSource,
  dataSourceLabel,
  fetchJson,
  build5etoolsApi,
  buildSpellClassIndex,
  normalize5etoolsSpell,
  RuleRepository,
  setRuleRepository,
  slugifyName,
  entriesToText,
  itemKey,
  deriveProficiencyBonus,
  normalizeCharacterState,
  persist,
  renderChrome,
}) {
  async function hydrateApiData() {
    const state = getState();
    state.dataStatus = "carregando 5etools 2024";
    renderChrome();
    try {
      const [classes, races, subraces, equipment, spells, classSpells, classFeatures, subclassFeatures, subclasses, feats, backgrounds] = await Promise.all([
        fetchJson(`${dataSource}/classes.json`),
        fetchJson(`${dataSource}/races.json`),
        fetchJson(`${dataSource}/subraces.json`),
        fetchJson(`${dataSource}/equipment.json`),
        fetchJson(`${dataSource}/spells.json`),
        fetchJson(`${dataSource}/class-spells.json`),
        fetchJson(`${dataSource}/class-features.json`),
        fetchJson(`${dataSource}/subclass-features.json`),
        fetchJson(`${dataSource}/subclasses.json`),
        fetchJson(`${dataSource}/feats.json`),
        fetchJson(`${dataSource}/backgrounds.json`),
      ]);
      state.api = build5etoolsApi(
        { classes, races, subraces, equipment, spells, classSpells, classFeatures, subclassFeatures, subclasses, feats, backgrounds },
        {
          slugifyName,
          entriesToText,
          itemKey,
          deriveProficiencyBonus,
          buildSpellClassIndex,
          normalize5etoolsSpell,
        },
      );
      setRuleRepository(RuleRepository.fromApi(state.api));
      state.dataStatus = dataSourceLabel;
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
    const state = getState();
    if (!spellName || state.api.spellDetails[spellName]) return;
    const detail = state.api.source?.spellDetails?.[spellName.toLowerCase()];
    if (detail) {
      state.api.spellDetails[spellName] = detail;
      persist();
    }
  }

  return {
    hydrateApiData,
    loadClassData,
    loadRaceData,
    loadClassSpellOptions,
    loadSpellDetails,
  };
}
