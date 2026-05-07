import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";

type AdminProductInput = {
  title: string;
  description: string;
  brand: string;
  price: number;
  categoryId: number;
  imageUrl?: string | null;
  vehicleSpecIds?: number[];
};

const DEFAULT_PRODUCT_IMAGE = "https://via.placeholder.com/800x600?text=AutoPulse+Product";

const ADMIN_PRODUCT_SELECT = {
  id: true,
  title: true,
  description: true,
  brand: true,
  imageUrl: true,
  price: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true
    }
  },
  compatibility: {
    select: {
      vehicleSpecId: true
    }
  },
  createdAt: true,
  updatedAt: true
} as const;

function makeHttpError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function normalizeVehicleSpecIds(vehicleSpecIds: number[] | undefined): number[] {
  if (!vehicleSpecIds?.length) {
    return [];
  }

  return Array.from(new Set(vehicleSpecIds));
}

function normalizeImageUrl(imageUrl: string | null | undefined): string {
  if (typeof imageUrl !== "string") {
    return DEFAULT_PRODUCT_IMAGE;
  }

  const normalized = imageUrl.trim();
  return normalized.length > 0 ? normalized : DEFAULT_PRODUCT_IMAGE;
}

async function validateCategoryAndSpecs(
  fastify: FastifyInstance,
  categoryId: number,
  vehicleSpecIds: number[]
): Promise<void> {
  const [category, specCount] = await Promise.all([
    fastify.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true }
    }),
    vehicleSpecIds.length
      ? fastify.prisma.vehicleSpec.count({
          where: {
            id: { in: vehicleSpecIds }
          }
        })
      : Promise.resolve(0)
  ]);

  if (!category) {
    throw makeHttpError("Category not found", 404);
  }

  if (vehicleSpecIds.length && specCount !== vehicleSpecIds.length) {
    throw makeHttpError("One or more vehicle specs were not found", 404);
  }
}

function mapAdminProduct(product: Prisma.ProductGetPayload<{ select: typeof ADMIN_PRODUCT_SELECT }>) {
  return {
    ...product,
    vehicleSpecIds: product.compatibility.map((entry) => entry.vehicleSpecId)
  };
}

export async function getAdminProducts(fastify: FastifyInstance, search?: string) {
  const normalizedSearch = search?.trim();
  const where: Prisma.ProductWhereInput = normalizedSearch
    ? {
        OR: [
          { title: { contains: normalizedSearch, mode: "insensitive" } },
          { description: { contains: normalizedSearch, mode: "insensitive" } }
        ]
      }
    : {};

  const products = await fastify.prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: ADMIN_PRODUCT_SELECT
  });

  return products.map(mapAdminProduct);
}

export async function getAdminProductById(fastify: FastifyInstance, id: number) {
  const product = await fastify.prisma.product.findUnique({
    where: { id },
    select: ADMIN_PRODUCT_SELECT
  });

  if (!product) {
    throw makeHttpError("Product not found", 404);
  }

  return mapAdminProduct(product);
}

export async function createAdminProduct(fastify: FastifyInstance, input: AdminProductInput) {
  const vehicleSpecIds = normalizeVehicleSpecIds(input.vehicleSpecIds);
  await validateCategoryAndSpecs(fastify, input.categoryId, vehicleSpecIds);

  const created = await fastify.prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        brand: input.brand.trim(),
        imageUrl: normalizeImageUrl(input.imageUrl),
        price: input.price,
        categoryId: input.categoryId
      }
    });

    if (vehicleSpecIds.length) {
      await tx.productCompatibility.createMany({
        data: vehicleSpecIds.map((vehicleSpecId) => ({
          productId: product.id,
          vehicleSpecId,
          source: "ADMIN"
        }))
      });
    }

    return tx.product.findUnique({
      where: { id: product.id },
      select: ADMIN_PRODUCT_SELECT
    });
  });

  return mapAdminProduct(created!);
}

export async function updateAdminProduct(fastify: FastifyInstance, id: number, input: AdminProductInput) {
  const existing = await fastify.prisma.product.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existing) {
    throw makeHttpError("Product not found", 404);
  }

  const vehicleSpecIds = normalizeVehicleSpecIds(input.vehicleSpecIds);
  await validateCategoryAndSpecs(fastify, input.categoryId, vehicleSpecIds);

  const updated = await fastify.prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        brand: input.brand.trim(),
        imageUrl: normalizeImageUrl(input.imageUrl),
        price: input.price,
        categoryId: input.categoryId
      }
    });

    await tx.productCompatibility.deleteMany({
      where: { productId: id }
    });

    if (vehicleSpecIds.length) {
      await tx.productCompatibility.createMany({
        data: vehicleSpecIds.map((vehicleSpecId) => ({
          productId: id,
          vehicleSpecId,
          source: "ADMIN"
        }))
      });
    }

    return tx.product.findUnique({
      where: { id },
      select: ADMIN_PRODUCT_SELECT
    });
  });

  return mapAdminProduct(updated!);
}

export async function deleteAdminProduct(fastify: FastifyInstance, id: number) {
  const existing = await fastify.prisma.product.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existing) {
    throw makeHttpError("Product not found", 404);
  }

  await fastify.prisma.product.delete({
    where: { id }
  });
}
