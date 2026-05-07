import { normalizeRuleAtom, validateRuleAtom, type RuleAtom, type RuleType, type ActivationType } from "./rule-schema.js";

export class RuleRepository {
  private rules = new Map<string, RuleAtom>();
  private byType = new Map<string, Map<string, RuleAtom>>();
  public validationErrors: Array<{ uuid: string; errors: string[] }> = [];

  constructor(rules: RuleAtom[] = []) {
    this.addRules(rules);
  }

  static fromApi(api: any): RuleRepository {
    const source = api?.source ?? {};
    const rules: RuleAtom[] = [
      ...Object.values(api?.classes ?? {}).map((item: any) => normalizeRuleAtom(item, "feature", {
        uuid: `class:${slugify(item.name ?? "unknown")}`,
        metadata: { version: "5.5e", tags: ["class"], source: item.source ?? "local" },
      })),
      ...(source.classFeatures ?? []).map((item: any) => normalizeRuleAtom(item, "feature", {
        uuid: `feature:${slugify(item.className)}:${slugify(item.name)}:${item.level ?? 1}:${String(item.source ?? "local").toLowerCase()}`,
        metadata: { version: "5.5e", tags: ["class-feature", slugify(item.className)], source: item.source ?? "local" },
      })),
      ...Object.values(source.spellDetails ?? {}).map((item: any) => normalizeRuleAtom(item, "spell", {
        uuid: `spell:${slugify(item.name)}:${String(item.source ?? "local").toLowerCase()}`,
        activation: { type: actionActivationFromCastingTime(item.castingTime), resource_cost: item.level > 0 ? "spell_slot" : null },
        metadata: { version: "5.5e", tags: ["spell", `level-${item.level ?? 0}`], source: item.source ?? "local" },
      })),
      ...Object.values(source.itemDetails ?? {}).map((item: any) => normalizeRuleAtom(item, "item", {
        uuid: `item:${slugify(item.name)}:${String(item.source ?? "local").toLowerCase()}`,
        activation: { type: "on_equip", resource_cost: null },
        metadata: { version: "5.5e", tags: ["item"], source: item.source ?? "local" },
      })),
    ];

    return new RuleRepository(rules);
  }

  addRules(rules: RuleAtom[] = []): void {
    rules.forEach((rule) => this.addRule(rule));
  }

  addRule(rule: RuleAtom): boolean {
    const validation = validateRuleAtom(rule);
    if (!validation.valid) {
      this.validationErrors.push({ uuid: rule?.uuid ?? "(unknown)", errors: validation.errors });
      return false;
    }

    this.rules.set(rule.uuid, rule);
    if (!this.byType.has(rule.type)) this.byType.set(rule.type, new Map());
    this.byType.get(rule.type)!.set(rule.uuid, rule);
    return true;
  }

  get(uuid: string): RuleAtom | null {
    return this.rules.get(uuid) ?? null;
  }

  findByType(type: RuleType): RuleAtom[] {
    return [...(this.byType.get(type)?.values() ?? [])];
  }

  findByTag(tag: string): RuleAtom[] {
    return [...this.rules.values()].filter((rule) => rule.metadata?.tags?.includes(tag));
  }

  get size(): number {
    return this.rules.size;
  }
}

function actionActivationFromCastingTime(castingTime = ""): ActivationType {
  const text = String(castingTime).toLowerCase();
  if (text.includes("bonus")) return "bonus";
  if (text.includes("reaction")) return "reaction";
  if (text.includes("action")) return "action";
  return "manual";
}

function slugify(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
