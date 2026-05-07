/**
 * Resource Engine - Lógica para identificar e calcular usos de recursos de classe/raça
 */
import type { ApiState } from '../../types/state.js';
export interface ResourceRecovery {
    short?: 'all' | number | string;
    long?: 'all' | number | string;
}
export interface ResourceMeta {
    id: string;
    name: string;
    tableLabels: string[];
    match: RegExp;
    isCanonical?: boolean;
}
export interface ResourceDefinition {
    id: string;
    name: string;
    className?: string;
    kind?: string;
    sourceLabel?: string;
    body: string;
    level: number;
    max: number;
    recovery: ResourceRecovery;
    actionKind: string;
    isCanonical?: boolean;
}
export declare const RESOURCE_META: ResourceMeta[];
export declare function resourceRecoveryFromBody(body: string): ResourceRecovery;
export declare function resourceActionKindFromBody(body: string): string;
export declare function resourceRecoveryLabel(recovery?: ResourceRecovery): string;
export declare function clean5etoolsText(value: string): string;
export declare function resourceMaxFromBody(body: string, api: ApiState, character: any, level?: number, meta?: ResourceMeta | null): number;
//# sourceMappingURL=resource-engine.d.ts.map