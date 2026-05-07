import { escapeHtml, paragraphs } from '../../lib/utils.js';
export function renderAttacksSheet(actions, filter, availableSpellSlotsAtLevel, selectedActionId, resources, resourceRecoveryLabel) {
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
    ${filter === "all"
        ? renderActionSections(actions, selectedActionId, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel)
        : renderActionSection(actionFilterTitle(filter), filtered, filter, selectedActionId, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel)}
  `;
}
function renderActionSections(actions, selectedActionId, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel) {
    return ["attack", "action", "bonus", "reaction", "other", "limited"]
        .map((kind) => renderActionSection(actionFilterTitle(kind), actions.filter((action) => action.kind === kind), kind, selectedActionId, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel))
        .join("");
}
function renderActionSection(title, actions, kind, selectedActionId, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel) {
    if (!actions.length)
        return "";
    return `
    <div class="actions-heading"><strong>${escapeHtml(title)}</strong>${kind === "attack" ? `<span>Attacks per Action: 1</span>` : ""}</div>
    <div class="actions-table">
      <div class="actions-table-head">
        <span>Attack</span><span>Range</span><span>Hit / DC</span><span>Damage</span><span>Notes</span>
      </div>
      ${actions.map(action => renderActionRow(action, selectedActionId, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel)).join("")}
    </div>
  `;
}
function renderActionRow(action, selectedActionId, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel) {
    const open = selectedActionId === action.id;
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
      ${open ? renderActionDetail(action, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel) : ""}
    </article>
  `;
}
function renderActionDetail(action, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel) {
    return `
    <div class="action-detail">
      ${action.detail ? paragraphs(action.detail) : `<p>${escapeHtml(action.notes || "Sem detalhes adicionais.")}</p>`}
      ${renderActionUse(action, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel)}
    </div>
  `;
}
function renderActionUse(action, availableSpellSlotsAtLevel, resources, resourceRecoveryLabel) {
    if (action.resource)
        return renderResourceUse(action.resource, resources, resourceRecoveryLabel);
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
function renderResourceUse(resourceId, resources, resourceRecoveryLabel) {
    const resource = resources?.[resourceId];
    if (!resource)
        return "";
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
//# sourceMappingURL=attacks-view.js.map