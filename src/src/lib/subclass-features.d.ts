/**
 * Subclass Features - Gerenciamento de features automaticas de subclasse
 *
 * Algumas subclasses (como Berserker para Barbarian) possuem features
 * que sao adquiridas automaticamente em determinados levels.
 */
export interface SubclassFeatureReference {
    name: string;
    className: string;
    source: string;
    subclassName: string;
    subclassSource: string;
    level: number;
}
/**
 * Parse uma string de subclass feature no formato:
 * "Name|Class|Source|Subclass|SubclassSource|Level"
 */
export declare function parseSubclassFeature(featureStr: string): SubclassFeatureReference | null;
/**
 * Retorna as features da subclasse para um determinado nivel
 */
export declare function getSubclassFeaturesByLevel(subclassFeatures: string[] | undefined, level: number): SubclassFeatureReference[];
/**
 * Verifica se uma feature de subclasse e automatica
 */
export declare function isAutoSubclassFeature(featureType: string | undefined): boolean;
//# sourceMappingURL=subclass-features.d.ts.map