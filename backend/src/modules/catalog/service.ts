import { Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";

type GetProductsQuery = {
  categoryId?: number;
  brand?: string;
  search?: string;
  sortBy?: "price_asc" | "price_desc";
};

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

  if (query.categoryId !== undefined) {
    where.categoryId = query.categoryId;
  }

  if (query.brand) {
    where.brand = query.brand;
  }

  const products = await fastify.prisma.product.findMany({
    where,
    orderBy: buildOrderBy(query.sortBy),
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
      }
    }
  });

  if (!query.search) {
    return products;
  }

  const normalizedSearch = query.search.trim().toLowerCase();

  return products.filter((product) => {
    return (
      product.title.toLowerCase().includes(normalizedSearch) ||
      product.description.toLowerCase().includes(normalizedSearch)
    );
  });
}

export async function getProductById(fastify: FastifyInstance, id: number) {
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
      }
    }
  });

  if (!product) {
    const error = new Error("Product not found") as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  return product;
}
