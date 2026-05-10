export interface HitDieDto {
  amount: number;
  source: 'short_rest' | 'healing';
  description?: string;
}
