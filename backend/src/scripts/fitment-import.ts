import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type ImportRecord = {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  engineName: string;
  engineCode?: string | null;
  productTitle: string;
  source?: string;
};

const prisma = new PrismaClient();

function normalizeRecord(raw: ImportRecord): ImportRecord {
  return {
    ...raw,
    make: raw.make.trim(),
    model: raw.model.trim(),
    engineName: raw.engineName.trim(),
    productTitle: raw.productTitle.trim(),
    source: raw.source?.trim() || "PROVIDER",
    engineCode: raw.engineCode?.trim() || ""
  };
}

async function loadRecords(filePath: string) {
  const absPath = path.resolve(filePath);
  const content = await fs.readFile(absPath, "utf8");
  const parsed = JSON.parse(content) as ImportRecord[];
  return parsed.map(normalizeRecord);
}

async function run() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    throw new Error("Provide input file path: npm run import:fitment -- ./data/provider-fitment.json");
  }

  const records = await loadRecords(inputFile);
  const batchSize = 250;
  let processed = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        const product = await tx.product.findUnique({
          where: { title: row.productTitle },
          select: { id: true }
        });
        if (!product) {
          skipped += 1;
          continue;
        }

        const make = await tx.vehicleMake.upsert({
          where: { name: row.make },
          update: {},
          create: { name: row.make }
        });
        const model = await tx.vehicleModel.upsert({
          where: {
            makeId_name: {
              makeId: make.id,
              name: row.model
            }
          },
          update: {},
          create: {
            makeId: make.id,
            name: row.model
          }
        });
        const engine = await tx.vehicleEngine.upsert({
          where: {
            name_code: {
              name: row.engineName,
              code: row.engineCode ?? ""
            }
          },
          update: {},
          create: {
            name: row.engineName,
            code: row.engineCode ?? ""
          }
        });
        const spec = await tx.vehicleSpec.upsert({
          where: {
            modelId_engineId_yearFrom_yearTo: {
              modelId: model.id,
              engineId: engine.id,
              yearFrom: row.yearFrom,
              yearTo: row.yearTo
            }
          },
          update: {
            makeId: make.id,
            normalizedName: `${row.make} ${row.model} ${row.yearFrom}-${row.yearTo} ${row.engineName}`
          },
          create: {
            makeId: make.id,
            modelId: model.id,
            engineId: engine.id,
            yearFrom: row.yearFrom,
            yearTo: row.yearTo,
            normalizedName: `${row.make} ${row.model} ${row.yearFrom}-${row.yearTo} ${row.engineName}`
          }
        });

        await tx.productCompatibility.upsert({
          where: {
            productId_vehicleSpecId: {
              productId: product.id,
              vehicleSpecId: spec.id
            }
          },
          update: { source: row.source ?? "PROVIDER" },
          create: {
            productId: product.id,
            vehicleSpecId: spec.id,
            source: row.source ?? "PROVIDER"
          }
        });
      }
    });

    processed += batch.length;
    console.log(`[fitment-import] processed=${processed}/${records.length} skipped=${skipped}`);
  }

  console.log(`[fitment-import] done total=${records.length} skipped=${skipped}`);
}

run()
  .catch((error) => {
    console.error("[fitment-import] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
