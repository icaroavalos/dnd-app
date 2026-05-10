import {
  getClasses,
  getSpecies,
  getItems,
  getSpells,
  getClassSpells,
  getFeatures,
  getFeats,
  getBackgrounds,
} from '../../dist/src/lib/api-catalog-client.js?v=json-fallback';

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
      // Tenta buscar do backend primeiro, fallback para arquivos locais
      const [classesData, racesData, subracesData, equipmentData, spellsData, classSpellsData, classFeaturesData, subclassFeaturesData, subclassesData, featsData, backgroundsData] = await Promise.all([
        getClasses().then(r => r.results || []),
        getSpecies().then(r => r.results || []),
        fetchJson(`${dataSource}/subraces.json`),
        getItems().then(r => r.results || []),
        getSpells().then(r => r.results || []),
        getClassSpells().then(r => r.results || []),
        getFeatures().then(r => r.results || []),
        getFeatures().then(r => r.results || []),
        getSpecies().then(r => r.results || []),
        getFeats().then(r => r.results || []),
        getBackgrounds().then(r => r.results || []),
      ]);

      state.api = build5etoolsApi(
        {
          classes: classesData,
          races: racesData,
          subraces: subracesData,
          equipment: equipmentData,
          spells: spellsData,
          classSpells: classSpellsData,
          classFeatures: classFeaturesData,
          subclassFeatures: subclassFeaturesData,
          subclasses: subclassesData,
          feats: featsData,
          backgrounds: backgroundsData,
        },
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
