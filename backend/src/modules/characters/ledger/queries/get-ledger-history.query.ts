import { fromPrismaData } from '../shared/ledger-entry.utils.js';

export async function getLedgerHistory(
  prisma: any,
  characterId: string,
  limit = 50,
) {
  const entries = await prisma.resourceLedgerEntry.findMany({
    where: { characterId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return entries.map(fromPrismaData);
}
