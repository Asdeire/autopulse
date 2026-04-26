import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toVehicleLabel(make: string, model: string, yearFrom: number, yearTo: number, engine: string) {
  return `${make} ${model} ${yearFrom}-${yearTo} ${engine}`;
}

async function main() {
  await prisma.user.upsert({
    where: { email: "demo@autopulse.local" },
    update: {},
    create: {
      email: "demo@autopulse.local",
      password: "seed_password_placeholder"
    }
  });

  const categoryNames = ["Engine Oil", "Filters", "Brake System", "Electronics"];
  await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );

  const categories: Array<{ id: number; name: string }> = await prisma.category.findMany({
    where: { name: { in: categoryNames } }
  });
  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));

  const products = [
    {
      title: "Synthetic Engine Oil 5W-30",
      description: "Full synthetic oil for modern gasoline engines.",
      brand: "Mobil",
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
      price: 1299.0,
      categoryName: "Engine Oil"
    },
    {
      title: "Synthetic Engine Oil 5W-40",
      description: "High-performance synthetic oil for turbo engines.",
      brand: "Castrol",
      imageUrl: "https://images.unsplash.com/photo-1608424524166-0f1a7aef4c5d?auto=format&fit=crop&w=1200&q=80",
      price: 1399.0,
      categoryName: "Engine Oil"
    },
    {
      title: "Cabin Air Filter CF-210",
      description: "Dust and pollen cabin filter for daily driving.",
      brand: "Bosch",
      imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80",
      price: 499.0,
      categoryName: "Filters"
    },
    {
      title: "Oil Filter OF-88",
      description: "Spin-on oil filter for extended service intervals.",
      brand: "Mann",
      imageUrl: "https://images.unsplash.com/photo-1632823471565-1ec4f6f381bb?auto=format&fit=crop&w=1200&q=80",
      price: 359.0,
      categoryName: "Filters"
    },
    {
      title: "Front Brake Pads BP-320",
      description: "Low-noise ceramic brake pads for front axle.",
      brand: "ATE",
      imageUrl: "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=1200&q=80",
      price: 1899.0,
      categoryName: "Brake System"
    },
    {
      title: "Rear Brake Discs BD-455",
      description: "Ventilated rear brake discs with anti-corrosion coating.",
      brand: "Brembo",
      imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80",
      price: 2799.0,
      categoryName: "Brake System"
    },
    {
      title: "Spark Plug SP-11 Iridium",
      description: "Iridium spark plugs for stable ignition performance.",
      brand: "NGK",
      imageUrl: "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?auto=format&fit=crop&w=1200&q=80",
      price: 799.0,
      categoryName: "Electronics"
    },
    {
      title: "AGM Battery 70Ah",
      description: "Maintenance-free AGM battery for start-stop vehicles.",
      brand: "Varta",
      imageUrl: "https://images.unsplash.com/photo-1558423853-bb35f25733d8?auto=format&fit=crop&w=1200&q=80",
      price: 5499.0,
      categoryName: "Electronics"
    }
  ];

  await Promise.all(
    products.map((product) =>
      prisma.product.upsert({
        where: { title: product.title },
        update: {
          description: product.description,
          brand: product.brand,
          imageUrl: product.imageUrl,
          price: product.price,
          categoryId: categoryByName.get(product.categoryName)!
        },
        create: {
          title: product.title,
          description: product.description,
          brand: product.brand,
          imageUrl: product.imageUrl,
          price: product.price,
          categoryId: categoryByName.get(product.categoryName)!
        }
      })
    )
  );

  const fitmentSpecs = [
    {
      make: "Toyota",
      model: "Corolla",
      yearFrom: 2014,
      yearTo: 2018,
      engineName: "1.6 бензин",
      engineCode: "1ZR-FE"
    },
    {
      make: "Volkswagen",
      model: "Golf",
      yearFrom: 2013,
      yearTo: 2017,
      engineName: "1.4 TSI",
      engineCode: "CZCA"
    },
    {
      make: "BMW",
      model: "3 Series",
      yearFrom: 2012,
      yearTo: 2018,
      engineName: "2.0 дизель",
      engineCode: "N47D20"
    }
  ];

  for (const spec of fitmentSpecs) {
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
        normalizedName: toVehicleLabel(spec.make, spec.model, spec.yearFrom, spec.yearTo, spec.engineName)
      },
      create: {
        makeId: make.id,
        modelId: model.id,
        engineId: engine.id,
        yearFrom: spec.yearFrom,
        yearTo: spec.yearTo,
        normalizedName: toVehicleLabel(spec.make, spec.model, spec.yearFrom, spec.yearTo, spec.engineName)
      }
    });
  }

  const allProductIds = await prisma.product.findMany({
    select: { id: true }
  });
  const allVehicleSpecs = await prisma.vehicleSpec.findMany({
    select: { id: true }
  });

  await Promise.all(
    allProductIds.flatMap((product) =>
      allVehicleSpecs.map((vehicleSpec) =>
        prisma.productCompatibility.upsert({
          where: {
            productId_vehicleSpecId: {
              productId: product.id,
              vehicleSpecId: vehicleSpec.id
            }
          },
          update: { source: "SEED" },
          create: {
            productId: product.id,
            vehicleSpecId: vehicleSpec.id,
            source: "SEED"
          }
        })
      )
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
