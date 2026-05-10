import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hash(value: string): number {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) {
    result = (result * 31 + value.charCodeAt(i)) >>> 0;
  }
  return result;
}

async function run() {
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  const specs = await prisma.vehicleSpec.findMany({
    orderBy: { id: "asc" }
  });

  if (!products.length || !specs.length) {
    throw new Error("Need products and vehicle specs before fitment generation.");
  }

  let linked = 0;
  const linkedSpecIds = new Set<number>();
  for (const product of products) {
    const category = product.category.name.toLowerCase();
    const maxLinks =
      category.includes("oil") || category.includes("filter")
        ? Math.min(10, specs.length)
        : Math.min(6, specs.length);

    const offset = hash(product.title) % specs.length;
    const selectedSpecIds = new Set<number>();
    for (let i = 0; i < maxLinks; i += 1) {
      const spec = specs[(offset + i * 2) % specs.length];
      selectedSpecIds.add(spec.id);
    }

    for (const vehicleSpecId of selectedSpecIds) {
      await prisma.productCompatibility.upsert({
        where: {
          productId_vehicleSpecId: {
            productId: product.id,
            vehicleSpecId
          }
        },
        update: { source: "DEMO_GENERATOR" },
        create: {
          productId: product.id,
          vehicleSpecId,
          source: "DEMO_GENERATOR"
        }
      });
      linked += 1;
      linkedSpecIds.add(vehicleSpecId);
    }
  }

  let backfilledSpecs = 0;
  for (const spec of specs) {
    if (linkedSpecIds.has(spec.id)) {
      continue;
    }

    const fallbackProduct = products[hash(spec.normalizedName) % products.length];
    await prisma.productCompatibility.upsert({
      where: {
        productId_vehicleSpecId: {
          productId: fallbackProduct.id,
          vehicleSpecId: spec.id
        }
      },
      update: { source: "DEMO_GENERATOR" },
      create: {
        productId: fallbackProduct.id,
        vehicleSpecId: spec.id,
        source: "DEMO_GENERATOR"
      }
    });
    linked += 1;
    backfilledSpecs += 1;
  }

  console.log(
    `[generate-demo-fitment] done: ${linked} compatibility links (backfilled specs: ${backfilledSpecs})`
  );
}

run()
  .catch((error) => {
    console.error("[generate-demo-fitment] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
