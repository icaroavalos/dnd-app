export function build5etoolsApi(
  { classes, races, subraces, equipment, spells, classSpells, classFeatures, subclassFeatures, subclasses, feats, backgrounds },
  { slugifyName, entriesToText, itemKey, deriveProficiencyBonus, buildSpellClassIndex, normalize5etoolsSpell },
) {
  const classResults = resultsOf(classes);
  const raceResults = resultsOf(races);
  const subraceResults = resultsOf(subraces);
  const backgroundResults = resultsOf(backgrounds);
  const equipmentResults = resultsOf(equipment);
  const spellResults = resultsOf(spells);
  const classSpellResults = resultsObjectOf(classSpells);
  const classFeatureResults = resultsOf(classFeatures);
  const subclassFeatureResults = resultsOf(subclassFeatures);
  const subclassResults = resultsOf(subclasses);
  const featResults = resultsOf(feats);
  const spellByKey = new Map(spellResults.map((spell) => [`${spell.name.toLowerCase()}|${spell.source.toLowerCase()}`, spell]));

  const normalizedClassSpells = Object.fromEntries(Object.values(classSpellResults).map((list) => {
    const classKey = slugifyName(list.className);
    const options = (list.spells ?? [])
      .map((ref) => spellByKey.get(`${ref.name.toLowerCase()}|${ref.source.toLowerCase()}`))
      .filter(Boolean)
      .map((spell) => ({ name: spell.name, level: spell.level, source: spell.source }))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    return [classKey, options];
  }));
  const spellClassIndex = buildSpellClassIndex(normalizedClassSpells);

  function normalize5etoolsFeature(feature) {
    return {
      name: feature.name,
      source: feature.source,
      className: feature.className,
      classSource: feature.classSource,
      subclassShortName: feature.subclassShortName,
      subclassSource: feature.subclassSource,
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
        prof_bonus: deriveProficiencyBonus(index + 1),
        features: [],
        spellcasting,
      };
    });
  }

  function normalize5etoolsRace(race) {
    const explicitSubraces = subraceResults
      .filter((subrace) => slugifyName(subrace.raceName) === slugifyName(race.name))
      .map((subrace) => subrace.name)
      .filter(Boolean);
    const ancestryOptions = inferAncestryOptionsFromEntries(race.entries);

    // Extract traits from entries (entries with type "entries" and a name field)
    const traits = (race.entries ?? [])
      .filter((entry) => entry.type === 'entries' && entry.name)
      .map((entry) => ({
        name: entry.name,
        entries: entry.entries ?? [],
      }));

    return {
      details: race,
      subraces: explicitSubraces.length ? explicitSubraces : ancestryOptions,
      traits,
      // Expose size and movement from top-level fields
      size: race.size,
      speed: race.speed,
    };
  }

  return {
    classes: Object.fromEntries(classResults.map((klass) => [slugifyName(klass.name), normalize5etoolsClass(klass)])),
    levels: Object.fromEntries(classResults.map((klass) => [slugifyName(klass.name), build5etoolsLevels(klass)])),
    races: Object.fromEntries(raceResults.map((race) => [slugifyName(race.name), normalize5etoolsRace(race)])),
    spells: spellResults.map((spell) => spell.name),
    classSpells: normalizedClassSpells,
    spellDetails: {},
    source: {
      classOptions: classResults.map((klass) => [slugifyName(klass.name), klass.name]).sort((a, b) => a[1].localeCompare(b[1])),
      raceOptions: raceResults.map((race) => [slugifyName(race.name), race.name]).sort((a, b) => a[1].localeCompare(b[1])),
      backgroundOptions: backgroundResults
        .filter((background) => background.source === "XPHB")
        .map((background) => [background.name, background.name])
        .sort((a, b) => a[1].localeCompare(b[1])),
      backgroundDetails: Object.fromEntries(backgroundResults.map((background) => [background.name.toLowerCase(), background])),
      subraceDetails: Object.fromEntries(subraceResults.map((subrace) => [slugifyName(subrace.name), subrace])),
      itemDetails: Object.fromEntries(equipmentResults.map((item) => [itemKey(item.name, item.source), item])),
      classFeatures: classFeatureResults.map(normalize5etoolsFeature),
      subclassFeatures: subclassFeatureResults.map(normalize5etoolsFeature),
      subclasses: subclassResults,
      featDetails: Object.fromEntries(featResults.map((feat) => [slugifyName(feat.name), normalize5etoolsFeature({ ...feat, type: "feat" })])),
      spellDetails: Object.fromEntries(spellResults.map((spell) => [spell.name.toLowerCase(), normalize5etoolsSpell(spell, spellClassIndex)])),
    },
  };
}

function resultsOf(value) {
  if (Array.isArray(value)) return value;
  return value?.results ?? [];
}

function resultsObjectOf(value) {
  if (Array.isArray(value)) return value;
  return value?.results ?? {};
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

export function walkEntries(value, visitor) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkEntries(item, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;
  visitor(value);
  Object.values(value).forEach((item) => walkEntries(item, visitor));
}
