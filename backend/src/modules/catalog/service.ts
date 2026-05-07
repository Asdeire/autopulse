import { Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";

type GetProductsQuery = {
  categoryId?: number;
  brand?: string;
  search?: string;
  sortBy?: "price_asc" | "price_desc";
  vehicleSpecId?: number;
  onlyCompatible?: boolean;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

function buildOrderBy(sortBy?: "price_asc" | "price_desc"): Prisma.ProductOrderByWithRelationInput {
  if (sortBy === "price_desc") {
    return { price: "desc" };
  }

  if (sortBy === "price_asc") {
    return { price: "asc" };
  }

  return { createdAt: "desc" };
}

export async function getCategories(fastify: FastifyInstance) {
  return fastify.prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true
    }
  });
}

export async function getProducts(fastify: FastifyInstance, query: GetProductsQuery) {
  const where: Prisma.ProductWhereInput = {};
  const page = query.page ?? DEFAULT_PAGE;
  const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const skip = (page - 1) * pageSize;

  if (query.categoryId !== undefined) {
    where.categoryId = query.categoryId;
  }

  if (query.brand) {
    where.brand = query.brand;
  }

  if (query.search) {
    const normalizedSearch = query.search.trim();
    if (normalizedSearch.length > 0) {
      where.OR = [
        { title: { contains: normalizedSearch, mode: "insensitive" } },
        { description: { contains: normalizedSearch, mode: "insensitive" } }
      ];
    }
  }

  if (query.vehicleSpecId !== undefined && query.onlyCompatible) {
    where.compatibility = {
      some: {
        vehicleSpecId: query.vehicleSpecId
      }
    };
  }

  const [products, total] = await fastify.prisma.$transaction([
    fastify.prisma.product.findMany({
    where,
    orderBy: buildOrderBy(query.sortBy),
    skip,
    take: pageSize,
    select: {
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
      compatibility: query.vehicleSpecId
        ? {
            where: {
              vehicleSpecId: query.vehicleSpecId
            },
            select: {
              id: true
            }
          }
        : false
    }
  }),
    fastify.prisma.product.count({ where })
  ]);

  const productsWithCompatibility = products.map((product) => {
    const compatibilityEntries =
      "compatibility" in product && Array.isArray(product.compatibility) ? product.compatibility : [];
    return {
      ...product,
      isCompatible: query.vehicleSpecId ? compatibilityEntries.length > 0 : null
    };
  });

  return {
    items: productsWithCompatibility,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

const PRODUCT_BASE_SELECT = {
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
  }
} as const;

export async function getRecommendedProducts(fastify: FastifyInstance, id: number, limit = 6) {
  const current = await fastify.prisma.product.findUnique({
    where: { id },
    select: { brand: true, categoryId: true }
  });

  if (!current) {
    const error = new Error("Product not found") as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const sameBrand = await fastify.prisma.product.findMany({
    where: { brand: current.brand, id: { not: id } },
    take: limit,
    orderBy: { createdAt: "desc" },
    select: PRODUCT_BASE_SELECT
  });

  const remaining = limit - sameBrand.length;
  const sameBrandIds = sameBrand.map((p) => p.id);

  const sameCategory =
    remaining > 0
      ? await fastify.prisma.product.findMany({
          where: {
            categoryId: current.categoryId,
            id: { notIn: [id, ...sameBrandIds] }
          },
          take: remaining,
          orderBy: { createdAt: "desc" },
          select: PRODUCT_BASE_SELECT
        })
      : [];

  return [...sameBrand, ...sameCategory].map((p) => ({ ...p, isCompatible: null }));
}

export async function getProductById(fastify: FastifyInstance, id: number, vehicleSpecId?: number) {
  const product = await fastify.prisma.product.findUnique({
    where: { id },
    select: {
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
      compatibility: vehicleSpecId
        ? {
            where: {
              vehicleSpecId
            },
            select: {
              id: true
            }
          }
        : false
    }
  });

  if (!product) {
    const error = new Error("Product not found") as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const compatibilityEntries =
    "compatibility" in product && Array.isArray(product.compatibility) ? product.compatibility : [];

  return {
    ...product,
    isCompatible: vehicleSpecId ? compatibilityEntries.length > 0 : null
  };
}
