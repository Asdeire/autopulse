import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type DemoProduct = {
  title: string;
  description: string;
  brand: string;
  imageUrl: string;
  price: number;
  categoryName: string;
};

const prisma = new PrismaClient();

async function loadProducts(filePath: string): Promise<DemoProduct[]> {
  const content = await fs.readFile(path.resolve(filePath), "utf8");
  const parsed = JSON.parse(content) as DemoProduct[];
  return parsed.map((product) => ({
    ...product,
    title: product.title.trim(),
    description: product.description.trim(),
    brand: product.brand.trim(),
    imageUrl: product.imageUrl.trim(),
    categoryName: product.categoryName.trim()
  }));
}

async function run() {
  const inputFile = process.argv[2] ?? "./data/demo-products.json";
  const products = await loadProducts(inputFile);
  const categoryNames = [...new Set(products.map((product) => product.categoryName))];

  await prisma.$transaction(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );

  const categories = await prisma.category.findMany({
    where: { name: { in: categoryNames } },
    select: { id: true, name: true }
  });
  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));

  let createdOrUpdated = 0;
  for (const product of products) {
    const categoryId = categoryByName.get(product.categoryName);
    if (!categoryId) {
      continue;
    }

    await prisma.product.upsert({
      where: { title: product.title },
      update: {
        description: product.description,
        brand: product.brand,
        imageUrl: product.imageUrl,
        price: product.price,
        categoryId
      },
      create: {
        title: product.title,
        description: product.description,
        brand: product.brand,
        imageUrl: product.imageUrl,
        price: product.price,
        categoryId
      }
    });
    createdOrUpdated += 1;
  }

  console.log(`[import-demo-products] done: ${createdOrUpdated} products`);
}

run()
  .catch((error) => {
    console.error("[import-demo-products] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
