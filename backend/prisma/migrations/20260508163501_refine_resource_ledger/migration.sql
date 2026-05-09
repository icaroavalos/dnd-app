-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResourceLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'hp',
    "source" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceLedgerEntry_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ResourceLedgerEntry" ("amount", "characterId", "createdAt", "description", "eventType", "id", "metadata", "source") SELECT "amount", "characterId", "createdAt", "description", "eventType", "id", "metadata", "source" FROM "ResourceLedgerEntry";
DROP TABLE "ResourceLedgerEntry";
ALTER TABLE "new_ResourceLedgerEntry" RENAME TO "ResourceLedgerEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
