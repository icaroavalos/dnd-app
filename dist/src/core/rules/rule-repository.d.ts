import { type RuleAtom, type RuleType } from "./rule-schema.js";
export declare class RuleRepository {
    private rules;
    private byType;
    validationErrors: Array<{
        uuid: string;
        errors: string[];
    }>;
    constructor(rules?: RuleAtom[]);
    static fromApi(api: any): RuleRepository;
    addRules(rules?: RuleAtom[]): void;
    addRule(rule: RuleAtom): boolean;
    get(uuid: string): RuleAtom | null;
    findByType(type: RuleType): RuleAtom[];
    findByTag(tag: string): RuleAtom[];
    get size(): number;
}
//# sourceMappingURL=rule-repository.d.ts.map