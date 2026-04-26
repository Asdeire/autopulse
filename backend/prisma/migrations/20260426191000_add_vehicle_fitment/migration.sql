-- CreateTable
CREATE TABLE "VehicleMake" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VehicleModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "makeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleEngine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VehicleSpec" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "makeId" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,
    "engineId" INTEGER NOT NULL,
    "yearFrom" INTEGER NOT NULL,
    "yearTo" INTEGER NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleSpec_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VehicleSpec_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VehicleSpec_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "VehicleEngine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserVehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "vehicleSpecId" INTEGER NOT NULL,
    "nickname" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserVehicle_vehicleSpecId_fkey" FOREIGN KEY ("vehicleSpecId") REFERENCES "VehicleSpec" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductCompatibility" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "vehicleSpecId" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCompatibility_vehicleSpecId_fkey" FOREIGN KEY ("vehicleSpecId") REFERENCES "VehicleSpec" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMake_name_key" ON "VehicleMake"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_makeId_name_key" ON "VehicleModel"("makeId", "name");

-- CreateIndex
CREATE INDEX "VehicleModel_makeId_idx" ON "VehicleModel"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleEngine_name_code_key" ON "VehicleEngine"("name", "code");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleSpec_modelId_engineId_yearFrom_yearTo_key" ON "VehicleSpec"("modelId", "engineId", "yearFrom", "yearTo");

-- CreateIndex
CREATE INDEX "VehicleSpec_makeId_modelId_yearFrom_yearTo_engineId_idx" ON "VehicleSpec"("makeId", "modelId", "yearFrom", "yearTo", "engineId");

-- CreateIndex
CREATE INDEX "VehicleSpec_modelId_yearFrom_yearTo_idx" ON "VehicleSpec"("modelId", "yearFrom", "yearTo");

-- CreateIndex
CREATE UNIQUE INDEX "UserVehicle_userId_vehicleSpecId_key" ON "UserVehicle"("userId", "vehicleSpecId");

-- CreateIndex
CREATE INDEX "UserVehicle_userId_isPrimary_idx" ON "UserVehicle"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "UserVehicle_vehicleSpecId_idx" ON "UserVehicle"("vehicleSpecId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCompatibility_productId_vehicleSpecId_key" ON "ProductCompatibility"("productId", "vehicleSpecId");

-- CreateIndex
CREATE INDEX "ProductCompatibility_vehicleSpecId_idx" ON "ProductCompatibility"("vehicleSpecId");

-- CreateIndex
CREATE INDEX "ProductCompatibility_productId_vehicleSpecId_idx" ON "ProductCompatibility"("productId", "vehicleSpecId");
