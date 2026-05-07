/**
 * Spells View - View model and rendering for the spells tab.
 */
import { escapeHtml, paragraphs } from '../../lib/utils.js';
import { signed } from '../character/character-engine.js';
export function renderSpellsSheet(autoLeveledSpells, knownSpells, casterLevel, spellAttack, spellSaveDc, selectedSpellName, backgroundSpells, backgroundAbilityMetrics, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellFromKnownData, spellLevelLabel, ordinalLabel, deckLabels, classDecks, characterClass) {
    const spells = [...new Set([...knownSpells.map(s => s.name), ...backgroundSpells])];
    const selected = selectedSpellName && spells.includes(selectedSpellName) ? selectedSpellName : "";
    const spellDetailsByName = new Map(knownSpells.map((spell) => [spell.name, { ...spellFromKnownData(spell.name), ...spell }]));
    return `
    <div class="metric-row">
      <div class="small-card"><span>C Level</span><strong>${casterLevel}</strong></div>
      <div class="small-card"><span>Spell Attack</span><strong>${signed(spellAttack)}</strong></div>
      <div class="small-card"><span>Spell DC</span><strong>${spellSaveDc}</strong></div>
    </div>
    ${autoLeveledSpells.length ? renderAutoGrantedSpells(autoLeveledSpells, spellFromKnownData, ordinalLabel) : ""}
    ${renderSpellSheetGroups(knownSpells, selected, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellLevelLabel, ordinalLabel, deckLabels, classDecks, characterClass, spellDetailsByName)}
    ${backgroundSpells.length ? renderBackgroundSpellSource(backgroundSpells, backgroundAbilityMetrics, spellFromKnownData, ordinalLabel) : ""}
    ${spells.length || autoLeveledSpells.length ? "" : `<div class="empty-state">Nenhuma magia selecionada para esta ficha.</div>`}
  `;
}
function renderBackgroundSpellSource(spells, metrics, spellFromKnownData, ordinalLabel) {
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
              ${metrics ? `<span>Spell Attack ${signed(metrics.attackBonus)} • Spell DC ${metrics.saveDc}</span>` : ""}
              <em>Magic Initiate</em>
            </article>
          `;
    }).join("")}
      </div>
    </section>
  `;
}
function renderAutoGrantedSpells(spells, spellFromKnownData, ordinalLabel) {
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
              <em>${escapeHtml(spell.origin || "")}</em>
            </article>
          `;
    }).join("")}
      </div>
    </section>
  `;
}
function renderSpellSheetGroups(spells, selected, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellLevelLabel, ordinalLabel, deckLabels, classDecks, characterClass, spellDetailsByName) {
    const cantrips = spells.filter((spell) => spell.level === 0).sort((a, b) => a.name.localeCompare(b.name));
    const leveled = spells.filter((spell) => spell.level > 0).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    const slotLevels = Object.keys(spellSlotsMaxByLevel).map(Number).sort((a, b) => a - b);
    const fallbackLevels = [...new Set(leveled.map((spell) => spell.level))].sort((a, b) => a - b);
    return [
        cantrips.length ? renderSpellSheetGroup(0, cantrips, selected, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellLevelLabel, ordinalLabel, deckLabels, classDecks, characterClass, spellDetailsByName) : "",
        ...(slotLevels.length ? slotLevels : fallbackLevels).map((slotLevel) => renderSpellSheetGroup(slotLevel, leveled.filter((spell) => spell.level <= slotLevel), selected, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellLevelLabel, ordinalLabel, deckLabels, classDecks, characterClass, spellDetailsByName)),
    ].join("");
}
function renderSpellSheetGroup(level, spells, selected, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellLevelLabel, ordinalLabel, deckLabels, classDecks, characterClass, spellDetailsByName) {
    if (!spells.length)
        return "";
    return `
    <section class="spell-sheet-group">
      <div class="spell-strip">
        <span>${spellLevelLabel(level)}</span>
        ${level > 0 ? renderSpellSlotTrack(level, spellSlotsMaxByLevel, spellSlotsUsed) : ""}
      </div>
      ${spells.map((spell) => renderSpellSheetRow(spell, selected, level, availableSpellSlotsAtLevel, ordinalLabel, deckLabels, classDecks, characterClass, spellDetailsByName)).join("")}
    </section>
  `;
}
function renderSpellSheetRow(spell, selected, slotLevel, availableSpellSlotsAtLevel, ordinalLabel, deckLabels, classDecks, characterClass, spellDetailsByName) {
    const isSelected = spell.name === selected;
    const canCast = spell.level > 0 && availableSpellSlotsAtLevel(slotLevel) > 0;
    const badge = spell.level > 0 && spell.level !== slotLevel ? `<span class="spell-level-badge">${ordinalLabel(spell.level)}</span>` : "";
    const detail = spellDetailsByName.get(spell.name) ?? spell;
    return `
    <div class="spell-row">
      ${spell.level > 0 ? `<button type="button" class="cast-button" data-cast-spell-level="${slotLevel}" ${canCast ? "" : "disabled"}>${badge}Cast</button>` : `<span class="spell-at-will">At Will</span>`}
      <button type="button" class="purple-strip spell-button ${isSelected ? "active" : ""}" data-spell-name="${escapeHtml(spell.name)}">${escapeHtml(spell.name)}</button>
    </div>
    ${isSelected ? renderSpellCard(detail, deckLabels, classDecks, characterClass) : ""}
  `;
}
function renderSpellSlotTrack(level, spellSlotsMaxByLevel, spellSlotsUsed) {
    const slot = spellSlotsUsed[level] ?? { max: spellSlotsMaxByLevel[level] ?? 0, used: 0 };
    if (!slot.max)
        return "";
    return `
    <span class="spell-slots" aria-label="Slots nivel ${level}">
      ${Array.from({ length: slot.max }, (_, index) => `<span class="slot-box ${index < slot.used ? "used" : ""}"></span>`).join("")}
      <strong>Slots</strong>
    </span>
  `;
}
function renderSpellCard(detail, deckLabels, classDecks, characterClass) {
    const deck = (classDecks[characterClass] ?? "arcane");
    if (!detail || !detail.description) {
        return `<article class="spell-card deck-${deck}"><div class="spell-card-title">${escapeHtml(detail.name || "Unknown")}</div><div class="spell-card-body">Carregando descricao...</div></article>`;
    }
    return `
    <article class="spell-card deck-${deck}">
      <button type="button" class="spell-close" data-close-spell aria-label="Fechar descricao">x</button>
      <div class="spell-card-title">${escapeHtml(detail.name)}</div>
      <div class="spell-card-subtitle">${escapeHtml(detail.levelLine)}</div>
      <div class="spell-facts">
        <div class="spell-fact"><strong>Casting Time</strong><span>${escapeHtml(detail.castingTime || "-")}</span></div>
        <div class="spell-fact"><strong>Range</strong><span>${escapeHtml(detail.range || "-")}</span></div>
        <div class="spell-fact"><strong>Components</strong><span>${escapeHtml(detail.components || "-")}</span></div>
        <div class="spell-fact"><strong>Duration</strong><span>${escapeHtml(detail.duration || "-")}</span></div>
      </div>
      ${detail.material ? `<div class="spell-material"><strong>Material:</strong> ${escapeHtml(detail.material)}</div>` : ""}
      <div class="spell-card-body">${paragraphs(detail.description)}</div>
      ${detail.higherLevel ? `
        <div class="spell-higher-label">At Higher Levels</div>
        <div class="spell-card-body higher">${paragraphs(detail.higherLevel)}</div>
      ` : ""}
      <div class="spell-footer"><strong>${escapeHtml((deckLabels[deck] ?? "Arcane"))}</strong><span>D&D</span></div>
    </article>
  `;
}
//# sourceMappingURL=spells-view.js.map