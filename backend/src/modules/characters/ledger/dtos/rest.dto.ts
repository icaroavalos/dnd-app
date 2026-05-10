export interface RestDto {
  restType: 'short' | 'long';
  hpRegained: number;
  hitDiceRegained?: number;
  description?: string;
}
