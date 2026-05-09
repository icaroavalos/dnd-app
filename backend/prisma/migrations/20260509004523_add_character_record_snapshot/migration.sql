-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleset" TEXT NOT NULL DEFAULT '5e',
    "lineageId" TEXT NOT NULL DEFAULT 'human',
    "backgroundId" TEXT NOT NULL DEFAULT 'soldier',
    "alignment" TEXT NOT NULL DEFAULT 'Neutral',
    "experience" INTEGER NOT NULL DEFAULT 0,
    "recordJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("alignment", "backgroundId", "createdAt", "experience", "id", "lineageId", "name", "ruleset", "updatedAt", "userId") SELECT "alignment", "backgroundId", "createdAt", "experience", "id", "lineageId", "name", "ruleset", "updatedAt", "userId" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
