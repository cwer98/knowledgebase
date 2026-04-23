-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fiche" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subjectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "concepts" TEXT NOT NULL DEFAULT '[]',
    "summary" TEXT NOT NULL DEFAULT '',
    "keyNumbers" TEXT NOT NULL DEFAULT '[]',
    "sections" TEXT NOT NULL DEFAULT '[]',
    "content" TEXT NOT NULL DEFAULT '',
    "deepening" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fiche_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Fiche" ("concepts", "content", "createdAt", "deepening", "id", "subjectId", "tags", "title", "updatedAt") SELECT "concepts", "content", "createdAt", "deepening", "id", "subjectId", "tags", "title", "updatedAt" FROM "Fiche";
DROP TABLE "Fiche";
ALTER TABLE "new_Fiche" RENAME TO "Fiche";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
