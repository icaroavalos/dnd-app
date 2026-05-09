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
    const groupedByOrigin = groupFeaturesByOrigin(items);
    return `
    <div class="feature-filter-row">
      ${filters.map(([id, label]) => `<button type="button" class="feature-filter ${filter === id ? "active" : ""}" data-feature-filter="${id}">${label}</button>`).join("")}
    </div>
    <div class="feature-section-list">
      ${renderGroupedFeatures(groupedByOrigin, selectedFeatureId)}
    </div>
  `;
}
function groupFeaturesByOrigin(items) {
    const groups = {
        class: [],
        species: [],
        feat: [],
    };
    items.forEach(item => {
        if (groups[item.kind]) {
            groups[item.kind].push(item);
        }
    });
    return groups;
}
function renderGroupedFeatures(groups, selectedFeatureId) {
    const sections = [];
    if (groups.class && groups.class.length > 0) {
        sections.push(renderFeatureGroup("Class Features", groups.class, selectedFeatureId));
    }
    if (groups.species && groups.species.length > 0) {
        sections.push(renderFeatureGroup("Species Traits", groups.species, selectedFeatureId));
    }
    if (groups.feat && groups.feat.length > 0) {
        sections.push(renderFeatureGroup("Feats", groups.feat, selectedFeatureId));
    }
    return sections.join("");
}
function renderFeatureGroup(title, features, selectedFeatureId) {
    if (!features.length)
        return "";
    const sourceGroups = groupFeaturesBySource(features);
    return `
    <section class="feature-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="feature-group-list">
        ${Object.entries(sourceGroups).map(([source, sourceFeatures]) => `
          <div class="feature-source-group">
            <div class="feature-source-header">${escapeHtml(source)}</div>
            <div class="feature-compact-list">
              ${sourceFeatures.map(feature => renderFeatureCard(feature, selectedFeatureId)).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}
function groupFeaturesBySource(features) {
    const groups = {};
    features.forEach(item => {
        const source = extractSourceFromMeta(item.meta || "");
        if (!groups[source]) {
            groups[source] = [];
        }
        groups[source].push(item);
    });
    return groups;
}
function extractSourceFromMeta(meta) {
    const match = meta.match(/([^•]+)\s*([•|XPHB|PHB]+\s*[0-9]*)/);
    if (match) {
        return match[1].trim();
    }
    const parts = meta.split("•").map(s => s.trim());
    return parts[0] || "Unknown";
}
function renderFeatureCard(feature, selectedFeatureId) {
    const open = selectedFeatureId === feature.id;
    const levelInfo = extractLevelFromMeta(feature.meta || "");
    return `
    <article class="feature-card ${open ? "expanded" : ""}">
      <button type="button" class="feature-card-header ${open ? "active" : ""}" data-feature-id="${escapeHtml(feature.id)}" aria-expanded="${open}" aria-controls="feature-content-${escapeHtml(feature.id)}">
        <div class="feature-card-title">
          <strong>${escapeHtml(feature.name)}</strong>
          ${levelInfo ? `<span class="feature-level-badge">${escapeHtml(levelInfo)}</span>` : ""}
        </div>
        <span class="feature-meta-source">${escapeHtml(feature.meta || "")}</span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
      ${open ? `
        <div id="feature-content-${escapeHtml(feature.id)}" class="feature-card-body">
          ${feature.resource ? renderFeatureResource(feature.resource) : ""}
          ${paragraphs(feature.description)}
        </div>
      ` : ""}
    </article>
  `;
}
function extractLevelFromMeta(meta) {
    const match = meta.match(/(\w+)\s+\d+/);
    if (match) {
        return match[0];
    }
    return "";
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