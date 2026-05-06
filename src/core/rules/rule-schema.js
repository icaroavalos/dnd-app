const RULE_TYPES = new Set(["feature", "spell", "condition", "item", "action"]);
const ACTIVATION_TYPES = new Set(["passive", "action", "bonus", "reaction", "on_hit", "on_equip", "on_attune", "manual"]);

export function validateRuleAtom(rule) {
  const errors = [];

  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return { valid: false, errors: ["Rule must be an object."] };
  }

  if (!rule.uuid || typeof rule.uuid !== "string") errors.push("uuid must be a non-empty string.");
  if (!rule.type || !RULE_TYPES.has(rule.type)) errors.push(`type must be one of: ${[...RULE_TYPES].join(", ")}.`);
  if (!rule.metadata || typeof rule.metadata !== "object") errors.push("metadata must be an object.");
  if (rule.metadata && typeof rule.metadata.version !== "string") errors.push("metadata.version must be a string.");
  if (rule.metadata?.tags && !Array.isArray(rule.metadata.tags)) errors.push("metadata.tags must be an array when present.");

  if (rule.activation) {
    if (typeof rule.activation !== "object") errors.push("activation must be an object.");
    else if (!ACTIVATION_TYPES.has(rule.activation.type)) errors.push(`activation.type must be one of: ${[...ACTIVATION_TYPES].join(", ")}.`);
  }

  if (rule.constraints && typeof rule.constraints !== "object") errors.push("constraints must be an object when present.");
  if (rule.effects && !Array.isArray(rule.effects)) errors.push("effects must be an array when present.");
  if (rule.depends_on && !Array.isArray(rule.depends_on)) errors.push("depends_on must be an array when present.");

  return { valid: errors.length === 0, errors };
}

export function normalizeRuleAtom(input, type, defaults = {}) {
  const source = input?.source ? String(input.source) : defaults.source ?? "local";
  const name = input?.name ? String(input.name) : defaults.name ?? "Unnamed Rule";
  const uuid = defaults.uuid ?? `${type}:${slugify(name)}:${source.toLowerCase()}`;

  return {
    uuid,
    type,
    name,
    source,
    metadata: {
      version: defaults.version ?? "5.5e",
      tags: defaults.tags ?? [],
      source,
    },
    activation: defaults.activation ?? { type: "passive", resource_cost: null },
    constraints: defaults.constraints ?? {},
    effects: defaults.effects ?? [],
    depends_on: defaults.depends_on ?? [],
    raw: input,
  };
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
