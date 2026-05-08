/**
 * Spells View - View model and rendering for the spells tab.
 */
import { escapeHtml } from '../../lib/utils.js';
import { signed } from '../character/character-engine.js';
export function renderSpellsSheet(spells, casterLevel, spellAttack, spellSaveDc, selectedSpellName, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellFromKnownData) {
    const selected = selectedSpellName && spells.some((spell) => spell.name === selectedSpellName) ? selectedSpellName : '';
    const spellDetailsByName = new Map(spells.map((spell) => [spell.name, { ...spellFromKnownData(spell.name), ...spell }]));
    const levels = [...new Set(spells.map((spell) => spell.level))].sort((left, right) => left - right);
    return `
    <div class="metric-row">
      <div class="small-card"><span>C Level</span><strong>${casterLevel}</strong></div>
      <div class="small-card"><span>Spell Attack</span><strong>${signed(spellAttack)}</strong></div>
      <div class="small-card"><span>Spell DC</span><strong>${spellSaveDc}</strong></div>
    </div>
    ${levels.map((level) => renderSpellSheetGroup(level, spells.filter((spell) => spell.level === level), selected, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellDetailsByName)).join('')}
    ${spells.length ? '' : `<div class="empty-state">Nenhuma magia selecionada para esta ficha.</div>`}
  `;
}
function renderSpellSheetGroup(level, spells, selected, spellSlotsMaxByLevel, spellSlotsUsed, availableSpellSlotsAtLevel, spellDetailsByName) {
    if (!spells.length)
        return '';
    return `
    <section class="spell-sheet-group">
      <div class="spell-strip">
        <span>${spellLevelLabel(level)}</span>
        ${level > 0 ? renderSpellSlotTrack(level, spellSlotsMaxByLevel, spellSlotsUsed) : ''}
      </div>
      ${spells
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((spell) => renderSpellSheetRow(spell, selected, availableSpellSlotsAtLevel, spellDetailsByName))
        .join('')}
    </section>
  `;
}
function renderSpellSheetRow(spell, selected, availableSpellSlotsAtLevel, spellDetailsByName) {
    const isSelected = spell.name === selected;
    const detail = spellDetailsByName.get(spell.name) ?? spell;
    const sourceLine = buildSpellSourceLine(spell);
    return `
    <div class="spell-row">
      ${renderSpellActionButton(spell, availableSpellSlotsAtLevel)}
      <button type="button" class="purple-strip spell-button ${isSelected ? 'active' : ''}" data-spell-name="${escapeHtml(spell.name)}">
        <span class="spell-button-name">${escapeHtml(spell.name)}</span>
        ${sourceLine ? `<span class="spell-button-source">${escapeHtml(sourceLine)}</span>` : ''}
      </button>
    </div>
    ${isSelected ? renderSpellCard(detail) : ''}
  `;
}
function renderSpellActionButton(spell, availableSpellSlotsAtLevel) {
    if (spell.castMode === 'at-will')
        return `<span class="spell-at-will">At Will</span>`;
    if (spell.castMode === 'resource') {
        const remaining = Number(spell.remainingUses ?? 0);
        return `
      <button type="button" class="cast-button use-button" data-use-resource="${escapeHtml(spell.resourceId || '')}" ${remaining > 0 ? '' : 'disabled'}>
        Use
      </button>
    `;
    }
    const slotLevel = Number(spell.slotLevel ?? spell.level ?? 0);
    const canCast = slotLevel > 0 && availableSpellSlotsAtLevel(slotLevel) > 0;
    return `
    <button type="button" class="cast-button" data-cast-spell-level="${slotLevel}" ${canCast ? '' : 'disabled'}>
      Cast
    </button>
  `;
}
function buildSpellSourceLine(spell) {
    const segments = [];
    if (spell.sourceLabel)
        segments.push(spell.sourceLabel);
    if (spell.castMode === 'resource') {
        segments.push(`${Number(spell.remainingUses ?? 0)}/${Number(spell.maxUses ?? 0)} use`);
        if (spell.recoveryLabel)
            segments.push(spell.recoveryLabel);
    }
    return segments.join(' • ');
}
function renderSpellSlotTrack(level, spellSlotsMaxByLevel, spellSlotsUsed) {
    const slot = spellSlotsUsed[level] ?? { max: spellSlotsMaxByLevel[level] ?? 0, used: 0 };
    if (!slot.max)
        return '';
    return `
    <span class="spell-slots" aria-label="${spellLevelLabel(level)} slots">
      ${Array.from({ length: slot.max }, (_, index) => `<span class="slot-box ${index < slot.used ? 'used' : ''}"></span>`).join('')}
      <strong>${ordinalLabel(level)} Slots</strong>
    </span>
  `;
}
function renderSpellCard(detail) {
    if (!detail || !detail.description) {
        return `<article class="spell-card"><div class="spell-card-title">Unknown</div><div class="spell-card-body">Carregando descricao...</div></article>`;
    }
    const propertyTags = [
        detail.concentration ? `<span class="spell-property-tag">C</span>` : '',
        detail.ritual ? `<span class="spell-property-tag">R</span>` : '',
        ...(detail.damageTypes ?? []).map((type) => `<span class="spell-damage-tag">${escapeHtml(type)}</span>`),
    ].filter(Boolean).join('');
    return `
    <article class="spell-card">
      <button type="button" class="spell-close" data-close-spell aria-label="Close spell details">x</button>
      <div class="spell-card-head">
        <div class="spell-card-title">${escapeHtml(detail.name)}</div>
        <div class="spell-card-subtitle">${escapeHtml(detail.levelLine || '-')}</div>
        <div class="spell-property-row">${propertyTags}</div>
      </div>
      <div class="spell-power-box">
        <div class="spell-fact"><strong>Casting Time</strong><span>${escapeHtml(detail.castingTime || '-')}</span></div>
        <div class="spell-fact"><strong>Range</strong><span>${escapeHtml(detail.range || '-')}</span></div>
        <div class="spell-fact"><strong>Duration</strong><span>${escapeHtml(detail.duration || '-')}</span></div>
        <div class="spell-fact spell-fact-emphasis"><strong>Save / Attack</strong><span>${escapeHtml(detail.saveOrAttack || '-')}</span></div>
      </div>
      <div class="spell-components-box">
        <div class="spell-component-flags">
          ${(detail.componentFlags ?? []).map((flag) => `<span class="spell-component-chip">${escapeHtml(flag)}</span>`).join('')}
        </div>
        ${detail.material ? `<div class="spell-material"><strong>Material</strong><span>${escapeHtml(detail.material)}</span></div>` : ''}
      </div>
      <div class="spell-card-body">${renderSpellParagraphs(detail.description)}</div>
      ${detail.higherLevel ? `
        <div class="spell-higher-label">At Higher Levels</div>
        <div class="spell-card-body higher">${renderSpellParagraphs(detail.higherLevel)}</div>
      ` : ''}
      <div class="spell-footer">
        <div class="spell-footer-block">
          ${(detail.traditions ?? []).length ? `<strong>${escapeHtml(detail.traditions.join(' • '))}</strong>` : '<strong>-</strong>'}
          ${(detail.classes ?? []).length ? `<span>${escapeHtml(detail.classes.join(', '))}</span>` : ''}
        </div>
        <span>${escapeHtml(detail.reference || detail.source || '')}</span>
      </div>
    </article>
  `;
}
function renderSpellParagraphs(value) {
    return String(value || '')
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((paragraph) => `<p>${highlightDiceAndScaledDice(escapeHtml(paragraph))}</p>`)
        .join('');
}
function highlightDiceAndScaledDice(value) {
    return value.replace(/\b\d+d\d+(?:\s*[+\-]\s*\d+)?\b/gi, '<strong>$&</strong>');
}
function spellLevelLabel(level) {
    return level === 0 ? 'Cantrips' : `${ordinalLabel(level)} Level`;
}
function ordinalLabel(level) {
    const labels = { 1: '1st', 2: '2nd', 3: '3rd' };
    return labels[level] ?? `${level}th`;
}
//# sourceMappingURL=spells-view.js.map