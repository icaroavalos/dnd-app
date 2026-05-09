export function createFormControls({ escapeHtml }) {
  function field(path, label, value) {
    const id = path.replace(".", "-");
    return `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-path="${path}" value="${escapeHtml(value)}" /></div>`;
  }

  function numberField(path, label, value, min, max) {
    const id = path.replace(".", "-");
    return `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-path="${path}" type="number" min="${min}" max="${max}" value="${value}" /></div>`;
  }

  function selectField(path, label, value, options, disabled = false) {
    const id = path.replace(".", "-");
    return `
    <div class="field">
      <label for="${id}">${label}</label>
      <select id="${id}" data-path="${path}" ${disabled ? "disabled" : ""}>
        ${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${String(optionValue).toLowerCase() === String(value).toLowerCase() ? "selected" : ""}>${optionLabel}</option>`).join("")}
      </select>
    </div>
  `;
  }

  function checkbox(path, value, label, checked, disabled = false, locked = false) {
    return `<label class="${disabled ? "disabled" : ""} ${locked ? "locked" : ""}"><input type="checkbox" data-list="${path}" value="${escapeHtml(value)}" ${checked ? "checked" : ""} ${disabled || locked ? "disabled" : ""} /><span class="checkbox-label">${label}</span></label>`;
  }

  return { field, numberField, selectField, checkbox };
}
