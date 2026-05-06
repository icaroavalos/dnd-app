import { normalizeRuleAtom, validateRuleAtom } from "./rule-schema.js";

export class RuleRepository {
  constructor(rules = []) {
    this.rules = new Map();
    this.byType = new Map();
    this.validationErrors = [];
    this.addRules(rules);
  }

  static fromApi(api) {
    const source = api?.source ?? {};
    const rules = [
      ...Object.values(api?.classes ?? {}).map((item) => normalizeRuleAtom(item, "feature", {
        uuid: `class:${slugify(item.name ?? "unknown")}`,
        tags: ["class"],
      })),
      ...(source.classFeatures ?? []).map((item) => normalizeRuleAtom(item, "feature", {
        uuid: `feature:${slugify(item.className)}:${slugify(item.name)}:${item.level ?? 1}:${String(item.source ?? "local").toLowerCase()}`,
        tags: ["class-feature", slugify(item.className)],
      })),
      ...Object.values(source.spellDetails ?? {}).map((item) => normalizeRuleAtom(item, "spell", {
        uuid: `spell:${slugify(item.name)}:${String(item.source ?? "local").toLowerCase()}`,
        activation: { type: actionActivationFromCastingTime(item.castingTime), resource_cost: item.level > 0 ? "spell_slot" : null },
        tags: ["spell", `level-${item.level ?? 0}`],
      })),
      ...Object.values(source.itemDetails ?? {}).map((item) => normalizeRuleAtom(item, "item", {
        uuid: `item:${slugify(item.name)}:${String(item.source ?? "local").toLowerCase()}`,
        activation: { type: "on_equip", resource_cost: null },
        tags: ["item"],
      })),
    ];

    return new RuleRepository(rules);
  }

  addRules(rules = []) {
    rules.forEach((rule) => this.addRule(rule));
  }

  addRule(rule) {
    const validation = validateRuleAtom(rule);
    if (!validation.valid) {
      this.validationErrors.push({ uuid: rule?.uuid ?? "(unknown)", errors: validation.errors });
      return false;
    }

    this.rules.set(rule.uuid, rule);
    if (!this.byType.has(rule.type)) this.byType.set(rule.type, new Map());
    this.byType.get(rule.type).set(rule.uuid, rule);
    return true;
  }

  get(uuid) {
    return this.rules.get(uuid) ?? null;
  }

  findByType(type) {
    return [...(this.byType.get(type)?.values() ?? [])];
  }

  findByTag(tag) {
    return [...this.rules.values()].filter((rule) => rule.metadata?.tags?.includes(tag));
  }

  get size() {
    return this.rules.size;
  }
}

function actionActivationFromCastingTime(castingTime = "") {
  const text = String(castingTime).toLowerCase();
  if (text.includes("bonus")) return "bonus";
  if (text.includes("reaction")) return "reaction";
  if (text.includes("action")) return "action";
  return "manual";
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
