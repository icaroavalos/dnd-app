export type RuleType = 'feature' | 'spell' | 'condition' | 'item' | 'action';
export type ActivationType = 'passive' | 'action' | 'bonus' | 'reaction' | 'on_hit' | 'on_equip' | 'on_attune' | 'manual';
export interface RuleActivation {
    type: ActivationType;
    resource_cost?: string | null;
}
export interface RuleMetadata {
    version: string;
    tags: string[];
    source: string;
}
export interface RuleAtom {
    uuid: string;
    type: RuleType;
    name: string;
    source: string;
    metadata: RuleMetadata;
    activation: RuleActivation;
    constraints: Record<string, unknown>;
    effects: any[];
    depends_on: string[];
    raw?: any;
}
export declare function validateRuleAtom(rule: any): {
    valid: boolean;
    errors: string[];
};
export declare function normalizeRuleAtom(input: any, type: RuleType, defaults?: Partial<RuleAtom>): RuleAtom;
//# sourceMappingURL=rule-schema.d.ts.map