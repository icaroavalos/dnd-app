export function createSpellHelpers({
  getState,
  checkbox,
  titleCase,
  spellLevelLabel,
  spellSlotsMaxByLevel: typedSpellSlotsMaxByLevel,
  clamp,
  maxSpellLevelAvailable,
  spellFromKnownData,
  autoGrantedCantripNames,
  autoGrantedSpellNameSet,
}) {
  function renderSpellChoiceGroups(spellRule, spellCounts) {
    const state = getState();
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
    const state = getState();
    if (spellRule.totalMax === 0) return true;
    if (autoGrantedSpellNameSet().has(spell.name)) return true;
    if (state.character.spells.includes(spell.name)) return false;
    if (spell.level === 0) return spellCounts.cantrips >= spellRule.cantrips;
    return spellCounts.leveled >= spellRule.spellsMax;
  }

  function legalSpellOptions() {
    const state = getState();
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

  function legalSpellNames() {
    return new Set(legalSpellOptions().map((spell) => spell.name));
  }

  function selectedSpellCounts(spells = getState().character.spells) {
    const autoCantrips = autoGrantedCantripNames();
    return spellListCounts(
      [...new Set([...spells, ...autoCantrips])]
        .map((name) => spellFromKnownData(name))
        .filter((spell) => spell?.name && Number.isFinite(spell.level)),
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
    const state = getState();
    return typedSpellSlotsMaxByLevel(state.character, state.api);
  }

  function syncSpellSlots() {
    const state = getState();
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
    const state = getState();
    const slot = state.character.spellSlots?.[level];
    return Math.max(0, (Number(slot?.max) || 0) - (Number(slot?.used) || 0));
  }

  function castSpell(slotLevel) {
    const state = getState();
    if (!slotLevel || slotLevel <= 0) return;
    syncSpellSlots();
    const slot = state.character.spellSlots?.[slotLevel];
    if (!slot || Number(slot.used) >= Number(slot.max)) return;
    slot.used += 1;
  }

  function resetSpellSlots(options = {}) {
    const state = getState();
    syncSpellSlots();
    Object.values(state.character.spellSlots ?? {}).forEach((slot) => {
      if (options.pactOnly && state.api.classes[state.character.class]?.casterProgression !== "pact") return;
      slot.used = 0;
    });
  }

  return {
    renderSpellChoiceGroups,
    legalSpellOptions,
    legalSpellNames,
    selectedSpellCounts,
    spellSlotsMaxByLevel,
    syncSpellSlots,
    availableSpellSlotsAtLevel,
    castSpell,
    resetSpellSlots,
  };
}
