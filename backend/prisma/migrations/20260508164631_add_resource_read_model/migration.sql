-- CreateTable
CREATE TABLE "ResourceReadModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "currentHp" INTEGER NOT NULL DEFAULT 10,
    "tempHp" INTEGER NOT NULL DEFAULT 0,
    "hitDiceTotal" INTEGER NOT NULL DEFAULT 0,
    "hitDiceUsed" INTEGER NOT NULL DEFAULT 0,
    "spellSlots" TEXT NOT NULL DEFAULT '{}',
    "spellSlotsUsed" TEXT NOT NULL DEFAULT '{}',
    "generalResources" TEXT NOT NULL DEFAULT '{}',
    "ammo" TEXT NOT NULL DEFAULT '{}',
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResourceReadModel_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceReadModel_characterId_key" ON "ResourceReadModel"("characterId");
