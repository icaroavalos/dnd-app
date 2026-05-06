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
export function parseSubclassFeature(featureStr: string): SubclassFeatureReference | null {
  const parts = featureStr.split('|');
  if (parts.length < 6) return null;

  const name = parts[0] || '';
  const className = parts[1] || '';
  const source = parts[2] || '';
  const subclassName = parts[3] || '';
  const subclassSource = parts[4] || '';
  const levelStr = parts[5] || '';

  if (!name || !className || !source || !subclassName || !subclassSource) return null;

  const levelNum = parseInt(levelStr || '0', 10);
  if (isNaN(levelNum)) return null;

  return {
    name,
    className,
    source,
    subclassName,
    subclassSource,
    level: levelNum,
  };
}

/**
 * Retorna as features da subclasse para um determinado nivel
 */
export function getSubclassFeaturesByLevel(
  subclassFeatures: string[] | undefined,
  level: number
): SubclassFeatureReference[] {
  if (!subclassFeatures) return [];

  return subclassFeatures
    .map(parseSubclassFeature)
    .filter((feat): feat is SubclassFeatureReference => feat !== null && feat.level === level);
}

/**
 * Verifica se uma feature de subclasse e automatica
 */
export function isAutoSubclassFeature(featureType: string | undefined): boolean {
  return featureType === 'subclass-auto';
}
