import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = path.join(ROOT, "data", "5etools");
const inputArg = process.argv[2];
const FIVE_TOOLS_ROOT = inputArg
  ? path.resolve(inputArg)
  : path.resolve(ROOT, "5etools-v2.28.0");
const DATA = path.join(FIVE_TOOLS_ROOT, "data");

const rulesets = {
  "5e-2014": {
    label: "5e / 2014 rules from local 5etools",
    classEdition: (it) => (it.edition ?? "classic") !== "one",
    raceEdition: (it) => (it.edition ?? "classic") !== "one" && it.source !== "XPHB",
    contentEdition: (it) => (it.edition ?? "classic") !== "one" && it.source !== "XPHB",
    spellSource: (source) => source !== "XPHB",
    classSource: (source) => source !== "XPHB",
  },
  "5e-2024": {
    label: "5.5e / 2024 rules from local 5etools",
    classEdition: (it) => it.edition === "one" || it.source === "XPHB",
    raceEdition: (it) => it.edition === "one" || it.source === "XPHB" || it.source === "MPMM",
    contentEdition: (it) => it.edition === "one" || it.source === "XPHB",
    spellSource: (source) => source === "XPHB",
    classSource: (source) => source === "XPHB",
  },
};

await mkdir(OUT, { recursive: true });

const classFiles = await listJsonFiles(path.join(DATA, "class"), /^class-.*\.json$/);
const spellFiles = await listJsonFiles(path.join(DATA, "spells"), /^spells-.*\.json$/);
const spellSources = await readJson(path.join(DATA, "spells", "sources.json"));
const raceData = await readJson(path.join(DATA, "races.json"));
const backgroundData = await readJson(path.join(DATA, "backgrounds.json"));
const itemData = await readJson(path.join(DATA, "items-base.json"));
const featData = await readJson(path.join(DATA, "feats.json"));

const allClassData = await Promise.all(classFiles.map(readJson));
const allSpellData = await Promise.all(spellFiles.map(readJson));

const allClasses = allClassData.flatMap((file) => file.class ?? []);
const allSubclasses = allClassData.flatMap((file) => file.subclass ?? []);
const allClassFeatures = allClassData.flatMap((file) => file.classFeature ?? []);
const allSubclassFeatures = allClassData.flatMap((file) => file.subclassFeature ?? []);
const allSpells = allSpellData.flatMap((file) => file.spell ?? []);

const manifest = {
  generatedAt: new Date().toISOString(),
  source: {
    name: "5etools local data",
    path: FIVE_TOOLS_ROOT,
  },
  note: "Compact character-builder data extracted from the user's local 5etools folder. Source filtering is preserved so the app can distinguish 2014 and 2024 rules.",
  rulesets: {},
};

for (const [ruleset, config] of Object.entries(rulesets)) {
  const dir = path.join(OUT, ruleset);
  await mkdir(dir, { recursive: true });

  const classes = allClasses
    .filter(config.classEdition)
    .map((klass) => normalizeClass(klass, config));
  const classKeySet = new Set(classes.map((klass) => keyFor(klass.name, klass.source)));

  const subclasses = allSubclasses
    .filter((subclass) => classKeySet.has(keyFor(subclass.className, subclass.classSource)))
    .map(normalizeSubclass);

  const classFeatures = allClassFeatures
    .filter((feature) => classKeySet.has(keyFor(feature.className, feature.classSource)))
    .map(normalizeClassFeature);

  const subclassKeySet = new Set(subclasses.flatMap((subclass) => {
    const names = [subclass.name, subclass.shortName].filter(Boolean);
    return names.map((name) => keyFor(name, subclass.source, subclass.className, subclass.classSource));
  }));
  const subclassFeatures = allSubclassFeatures
    .filter((feature) => subclassKeySet.has(keyFor(feature.subclassShortName ?? feature.subclassName, feature.subclassSource, feature.className, feature.classSource)))
    .map(normalizeSubclassFeature);

  const races = (raceData.race ?? [])
    .filter(config.raceEdition)
    .map(normalizeRace);
  const subraces = (raceData.subrace ?? [])
    .filter((subrace) => config.raceEdition({ ...subrace, edition: subrace.edition ?? raceData.race?.find((race) => race.name === subrace.raceName && race.source === subrace.raceSource)?.edition }))
    .map(normalizeSubrace);
  const backgrounds = (backgroundData.background ?? [])
    .filter(config.contentEdition)
    .map(normalizeBackground);
  const equipment = (itemData.baseitem ?? [])
    .filter(config.contentEdition)
    .map(normalizeItem);
  const feats = (featData.feat ?? [])
    .filter(config.contentEdition)
    .map(normalizeFeat);
  const spells = allSpells
    .filter((spell) => config.spellSource(spell.source))
    .map(normalizeSpell);
  const classSpells = buildClassSpells(spells, spellSources, config);

  await writeJson(path.join(dir, "classes.json"), { ruleset, results: classes });
  await writeJson(path.join(dir, "subclasses.json"), { ruleset, results: subclasses });
  await writeJson(path.join(dir, "class-features.json"), { ruleset, results: classFeatures });
  await writeJson(path.join(dir, "subclass-features.json"), { ruleset, results: subclassFeatures });
  await writeJson(path.join(dir, "races.json"), { ruleset, results: races });
  await writeJson(path.join(dir, "subraces.json"), { ruleset, results: subraces });
  await writeJson(path.join(dir, "backgrounds.json"), { ruleset, results: backgrounds });
  await writeJson(path.join(dir, "equipment.json"), { ruleset, results: equipment });
  await writeJson(path.join(dir, "feats.json"), { ruleset, results: feats });
  await writeJson(path.join(dir, "spells.json"), { ruleset, results: spells });
  await writeJson(path.join(dir, "class-spells.json"), { ruleset, results: classSpells });

  manifest.rulesets[ruleset] = {
    label: config.label,
    counts: {
      classes: classes.length,
      subclasses: subclasses.length,
      classFeatures: classFeatures.length,
      subclassFeatures: subclassFeatures.length,
      races: races.length,
      subraces: subraces.length,
      backgrounds: backgrounds.length,
      equipment: equipment.length,
      feats: feats.length,
      spells: spells.length,
      classSpellLists: Object.keys(classSpells).length,
    },
  };
}

await writeJson(path.join(OUT, "manifest.json"), manifest);
console.log(`Built compact 5etools data into ${OUT}`);

function normalizeClass(klass) {
  return pickDefined({
    name: klass.name,
    source: klass.source,
    edition: klass.edition ?? "classic",
    hitDie: klass.hd ? `d${klass.hd.faces}` : null,
    proficiency: klass.proficiency ?? [],
    spellcastingAbility: klass.spellcastingAbility,
    casterProgression: klass.casterProgression,
    preparedSpells: klass.preparedSpells,
    preparedSpellsProgression: klass.preparedSpellsProgression,
    cantripProgression: klass.cantripProgression,
    startingProficiencies: klass.startingProficiencies,
    startingEquipment: klass.startingEquipment,
    multiclassing: klass.multiclassing,
    classTableGroups: klass.classTableGroups,
  });
}

function normalizeSubclass(subclass) {
  return pickDefined({
    name: subclass.name,
    shortName: subclass.shortName,
    source: subclass.source,
    className: subclass.className,
    classSource: subclass.classSource,
    subclassFeatures: subclass.subclassFeatures,
    additionalSpells: subclass.additionalSpells,
  });
}

function normalizeClassFeature(feature) {
  return pickDefined({
    name: feature.name,
    source: feature.source,
    className: feature.className,
    classSource: feature.classSource,
    level: feature.level,
    entries: feature.entries,
  });
}

function normalizeSubclassFeature(feature) {
  return pickDefined({
    name: feature.name,
    source: feature.source,
    className: feature.className,
    classSource: feature.classSource,
    subclassShortName: feature.subclassShortName,
    subclassSource: feature.subclassSource,
    level: feature.level,
    entries: feature.entries,
  });
}

function normalizeRace(race) {
  return pickDefined({
    name: race.name,
    source: race.source,
    edition: race.edition ?? "classic",
    size: race.size,
    speed: race.speed,
    ability: race.ability,
    skillProficiencies: race.skillProficiencies,
    languageProficiencies: race.languageProficiencies,
    entries: race.entries,
    srd: race.srd,
    srd52: race.srd52,
  });
}

function normalizeSubrace(subrace) {
  return pickDefined({
    name: subrace.name,
    source: subrace.source,
    raceName: subrace.raceName,
    raceSource: subrace.raceSource,
    edition: subrace.edition ?? "classic",
    ability: subrace.ability,
    skillProficiencies: subrace.skillProficiencies,
    languageProficiencies: subrace.languageProficiencies,
    entries: subrace.entries,
    srd: subrace.srd,
    srd52: subrace.srd52,
  });
}

function normalizeBackground(background) {
  return pickDefined({
    name: background.name,
    source: background.source,
    edition: background.edition ?? "classic",
    ability: background.ability,
    skillProficiencies: background.skillProficiencies,
    toolProficiencies: background.toolProficiencies,
    languageProficiencies: background.languageProficiencies,
    startingEquipment: background.startingEquipment,
    feats: background.feats,
    entries: background.entries,
  });
}

function normalizeItem(item) {
  return pickDefined({
    name: item.name,
    source: item.source,
    edition: item.edition ?? "classic",
    type: item.type,
    value: item.value,
    weight: item.weight,
    ac: item.ac,
    dmg1: item.dmg1,
    dmgType: item.dmgType,
    range: item.range,
    property: item.property,
    entries: item.entries,
  });
}

function normalizeFeat(feat) {
  return pickDefined({
    name: feat.name,
    source: feat.source,
    edition: feat.edition ?? "classic",
    category: feat.category,
    prerequisite: feat.prerequisite,
    repeatable: feat.repeatable,
    ability: feat.ability,
    entries: feat.entries,
    srd: feat.srd,
    srd52: feat.srd52,
  });
}

function normalizeSpell(spell) {
  return pickDefined({
    name: spell.name,
    source: spell.source,
    level: spell.level,
    school: spell.school,
    time: spell.time,
    range: spell.range,
    components: spell.components,
    duration: spell.duration,
    meta: spell.meta,
    entries: spell.entries,
    entriesHigherLevel: spell.entriesHigherLevel,
    srd: spell.srd,
    srd52: spell.srd52,
  });
}

function buildClassSpells(spells, sourceMap, config) {
  const spellKeys = new Set(spells.map((spell) => keyFor(spell.name, spell.source)));
  const lists = {};

  for (const [spellSource, spellMap] of Object.entries(sourceMap)) {
    if (!config.spellSource(spellSource)) continue;

    for (const [spellName, refs] of Object.entries(spellMap)) {
      if (!spellKeys.has(keyFor(spellName, spellSource))) continue;
      for (const klass of refs.class ?? []) {
        if (!config.classSource(klass.source)) continue;
        const listKey = keyFor(klass.name, klass.source);
        lists[listKey] ??= {
          className: klass.name,
          classSource: klass.source,
          spells: [],
        };
        lists[listKey].spells.push({ name: spellName, source: spellSource });
      }
    }
  }

  for (const list of Object.values(lists)) {
    list.spells.sort((a, b) => a.name.localeCompare(b.name));
  }

  return Object.fromEntries(Object.entries(lists).sort(([a], [b]) => a.localeCompare(b)));
}

async function listJsonFiles(dir, pattern) {
  const files = await readdir(dir);
  return files.filter((file) => pattern.test(file)).sort().map((file) => path.join(dir, file));
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

function keyFor(...parts) {
  return parts.map((part) => String(part ?? "").toLowerCase()).join("|");
}

function pickDefined(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null));
}
