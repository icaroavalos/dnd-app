export interface LedgerEntry {
  id: string;
  characterId: string;
  eventType: string;
  resourceType: string;
  amount: number;
  source: string;
  description: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface CreateLedgerInput {
  characterId: string;
  eventType: string;
  resourceType: string;
  amount: number;
  source: string;
  description?: string;
  metadata?: Record<string, any>;
}
