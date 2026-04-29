import https from "node:https";
import { PrismaClient } from "@prisma/client";

type VpicResponse = {
  Results?: Array<{ Model_Name?: string | null }>;
};

type VehicleSpecSeed = {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  engineName: string;
  engineCode: string;
};

const prisma = new PrismaClient();

const makeNames = ["Toyota", "Volkswagen", "BMW", "Audi", "Ford", "Honda", "Skoda"];
const preferredModels: Record<string, string[]> = {
  Volkswagen: ["Golf", "Passat", "Jetta", "Polo"],
  Toyota: ["Corolla", "Camry", "RAV4", "Yaris"],
  BMW: ["3 Series", "5 Series", "X3", "X5"],
  Audi: ["A3", "A4", "A6", "Q5"],
  Ford: ["Focus", "Mondeo", "Fiesta", "Kuga"],
  Honda: ["Civic", "Accord", "CR-V", "Jazz"],
  Skoda: ["Octavia", "Fabia", "Superb", "Kodiaq"]
};
const engines = [
  { name: "1.4 бензин", code: "GEN-14I" },
  { name: "1.6 бензин", code: "GEN-16I" },
  { name: "2.0 бензин", code: "GEN-20I" },
  { name: "1.9 дизель", code: "GEN-19D" },
  { name: "2.0 дизель", code: "GEN-20D" },
  { name: "1.4 турбо", code: "GEN-14T" }
];
const yearRanges = [
  { yearFrom: 1996, yearTo: 2000 },
  { yearFrom: 1999, yearTo: 2004 },
  { yearFrom: 2003, yearTo: 2008 },
  { yearFrom: 2007, yearTo: 2012 },
  { yearFrom: 2010, yearTo: 2014 },
  { yearFrom: 2013, yearTo: 2018 },
  { yearFrom: 2016, yearTo: 2021 }
];

function requestJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode ?? "unknown"} for ${url}`));
          return;
        }

        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          raw += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw) as T);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

async function loadModelsForMake(make: string): Promise<string[]> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`;
  const response = await requestJson<VpicResponse>(url);
  const unique = new Set<string>();
  for (const row of response.Results ?? []) {
    const modelName = row.Model_Name?.trim();
    if (modelName) {
      unique.add(modelName);
    }
    if (unique.size >= 10) {
      break;
    }
  }

  const preferred = preferredModels[make] ?? [];
  for (const model of preferred) {
    unique.add(model);
  }

  return [...unique].slice(0, 8);
}

function toVehicleLabel(spec: VehicleSpecSeed) {
  return `${spec.make} ${spec.model} ${spec.yearFrom}-${spec.yearTo} ${spec.engineName}`;
}

async function run() {
  const specs: VehicleSpecSeed[] = [];

  for (let makeIndex = 0; makeIndex < makeNames.length; makeIndex += 1) {
    const make = makeNames[makeIndex];
    const models = await loadModelsForMake(make);
    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const model = models[modelIndex];
      const selectedYearRanges = [
        yearRanges[(makeIndex + modelIndex) % yearRanges.length],
        yearRanges[(makeIndex + modelIndex + 2) % yearRanges.length]
      ];
      const selectedEngines = [
        engines[(makeIndex + modelIndex) % engines.length],
        engines[(makeIndex + modelIndex + 2) % engines.length],
        engines[(makeIndex + modelIndex + 4) % engines.length]
      ];

      for (const yearRange of selectedYearRanges) {
        for (const engine of selectedEngines) {
          specs.push({
            make,
            model,
            yearFrom: yearRange.yearFrom,
            yearTo: yearRange.yearTo,
            engineName: engine.name,
            engineCode: engine.code
          });
        }
      }
    }
  }

  // Guarantee older Golf options for UI demo (e.g. year 1998).
  specs.push(
    {
      make: "Volkswagen",
      model: "Golf",
      yearFrom: 1996,
      yearTo: 2000,
      engineName: "1.6 бензин",
      engineCode: "VW-GOLF-MK4-16I"
    },
    {
      make: "Volkswagen",
      model: "Golf",
      yearFrom: 1996,
      yearTo: 2000,
      engineName: "1.9 дизель",
      engineCode: "VW-GOLF-MK4-19D"
    },
    {
      make: "Volkswagen",
      model: "Golf",
      yearFrom: 1996,
      yearTo: 2000,
      engineName: "2.0 бензин",
      engineCode: "VW-GOLF-MK4-20I"
    }
  );

  for (const spec of specs) {
    const make = await prisma.vehicleMake.upsert({
      where: { name: spec.make },
      update: {},
      create: { name: spec.make }
    });
    const model = await prisma.vehicleModel.upsert({
      where: {
        makeId_name: {
          makeId: make.id,
          name: spec.model
        }
      },
      update: {},
      create: {
        makeId: make.id,
        name: spec.model
      }
    });
    const engine = await prisma.vehicleEngine.upsert({
      where: {
        name_code: {
          name: spec.engineName,
          code: spec.engineCode
        }
      },
      update: {},
      create: {
        name: spec.engineName,
        code: spec.engineCode
      }
    });

    await prisma.vehicleSpec.upsert({
      where: {
        modelId_engineId_yearFrom_yearTo: {
          modelId: model.id,
          engineId: engine.id,
          yearFrom: spec.yearFrom,
          yearTo: spec.yearTo
        }
      },
      update: {
        makeId: make.id,
        normalizedName: toVehicleLabel(spec)
      },
      create: {
        makeId: make.id,
        modelId: model.id,
        engineId: engine.id,
        yearFrom: spec.yearFrom,
        yearTo: spec.yearTo,
        normalizedName: toVehicleLabel(spec)
      }
    });
  }

  console.log(`[import-demo-vehicles] done: ${specs.length} vehicle specs`);
}

run()
  .catch((error) => {
    console.error("[import-demo-vehicles] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
