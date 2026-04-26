-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VehicleEngine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_VehicleEngine" ("code", "createdAt", "id", "name", "updatedAt")
SELECT COALESCE("code", ''), "createdAt", "id", "name", "updatedAt" FROM "VehicleEngine";
DROP TABLE "VehicleEngine";
ALTER TABLE "new_VehicleEngine" RENAME TO "VehicleEngine";
CREATE UNIQUE INDEX "VehicleEngine_name_code_key" ON "VehicleEngine"("name", "code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
