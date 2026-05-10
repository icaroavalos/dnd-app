import { fromPrismaData } from '../shared/ledger-entry.utils.js';

export async function getLedgerByEventType(
  prisma: any,
  characterId: string,
  eventType: string,
  limit = 50,
) {
  const entries = await prisma.resourceLedgerEntry.findMany({
    where: { characterId, eventType },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return entries.map(fromPrismaData);
}
