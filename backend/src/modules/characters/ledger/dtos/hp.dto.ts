export interface HpDto {
  amount: number;
  currentHp: number;
  source: 'damage' | 'healing' | 'temp_hp';
  description?: string;
}
