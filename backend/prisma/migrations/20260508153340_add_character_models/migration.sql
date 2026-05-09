-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleset" TEXT NOT NULL DEFAULT '5e',
    "lineageId" TEXT NOT NULL DEFAULT 'human',
    "backgroundId" TEXT NOT NULL DEFAULT 'soldier',
    "alignment" TEXT NOT NULL DEFAULT 'Neutral',
    "experience" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "CharacterClass_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AbilityScores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "str" INTEGER NOT NULL DEFAULT 10,
    "dex" INTEGER NOT NULL DEFAULT 10,
    "con" INTEGER NOT NULL DEFAULT 10,
    "int" INTEGER NOT NULL DEFAULT 10,
    "wis" INTEGER NOT NULL DEFAULT 10,
    "cha" INTEGER NOT NULL DEFAULT 10,
    CONSTRAINT "AbilityScores_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "baseItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'carried',
    CONSTRAINT "InventoryItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpellChoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "spellId" TEXT NOT NULL,
    "spellcastingAbility" TEXT,
    CONSTRAINT "SpellChoice_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackgroundChoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "choiceType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "BackgroundChoice_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RuntimeState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "hp" INTEGER NOT NULL DEFAULT 10,
    "maxHpOverride" INTEGER,
    "tempHp" INTEGER NOT NULL DEFAULT 0,
    "hitDiceUsed" INTEGER NOT NULL DEFAULT 0,
    "spellSlotsUsed" TEXT NOT NULL DEFAULT '{}',
    "activeConditions" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "RuntimeState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AbilityScores_characterId_key" ON "AbilityScores"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeState_characterId_key" ON "RuntimeState"("characterId");
