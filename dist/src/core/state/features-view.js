/**
 * Features View - View model and rendering for the features tab.
 */
import { escapeHtml, paragraphs } from '../../lib/utils.js';
export function renderFeaturesSheet(items, filter, selectedFeatureId) {
    const filtered = filter === "all" ? items : items.filter((item) => item.kind === filter);
    const filters = [
        ["all", "All"],
        ["class", "Class Features"],
        ["species", "Species Traits"],
        ["feat", "Feats"],
    ];
    return `
    <div class="feature-filter-row">
      ${filters.map(([id, label]) => `<button type="button" class="feature-filter ${filter === id ? "active" : ""}" data-feature-filter="${id}">${label}</button>`).join("")}
    </div>
    <div class="feature-section-list">
      ${renderFeatureSection("Class Features", filtered.filter((item) => item.kind === "class"), selectedFeatureId)}
      ${renderFeatureSection("Species Traits", filtered.filter((item) => item.kind === "species"), selectedFeatureId)}
      ${renderFeatureSection("Feats", filtered.filter((item) => item.kind === "feat"), selectedFeatureId)}
    </div>
  `;
}
function renderFeatureSection(title, features, selectedFeatureId) {
    if (!features.length)
        return "";
    return `
    <section class="feature-section">
      <h3>${escapeHtml(title)}</h3>
      ${features.map(feature => renderFeatureRow(feature, selectedFeatureId)).join("")}
    </section>
  `;
}
function renderFeatureRow(feature, selectedFeatureId) {
    const open = selectedFeatureId === feature.id;
    return `
    <article class="feature-row">
      <button type="button" class="feature-header ${open ? "active" : ""}" data-feature-id="${escapeHtml(feature.id)}">
        <strong>${escapeHtml(feature.name)}</strong>
        ${feature.meta ? `<small>${escapeHtml(feature.meta)}</small>` : ""}
        <span class="chevron"></span>
      </button>
      ${open ? `
        <div class="feature-body">
          ${feature.resource ? renderFeatureResource(feature.resource) : ""}
          ${paragraphs(feature.description)}
        </div>
      ` : ""}
    </article>
  `;
}
function renderFeatureResource(resource) {
    return `
    <div class="resource-use">
      <button type="button" class="cast-button" data-use-resource="${escapeHtml(resource.id)}" ${resource.remaining > 0 ? "" : "disabled"}>Use</button>
      <span>${resource.remaining}/${resource.max} uses - recupera em ${escapeHtml(resource.recoveryLabel.replace(" Resource", ""))}</span>
    </div>
  `;
}
//# sourceMappingURL=features-view.js.map