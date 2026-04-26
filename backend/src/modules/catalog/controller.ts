import { FastifyReply, FastifyRequest } from "fastify";
import { getCategories, getProductById, getProducts } from "./service";

type GetProductsQuery = {
  categoryId?: number;
  brand?: string;
  search?: string;
  sortBy?: "price_asc" | "price_desc";
};

type GetProductByIdParams = {
  id: number;
};

export async function getCategoriesController(request: FastifyRequest) {
  return getCategories(request.server);
}

export async function getProductsController(
  request: FastifyRequest<{ Querystring: GetProductsQuery }>
) {
  return getProducts(request.server, request.query);
}

export async function getProductByIdController(
  request: FastifyRequest<{ Params: GetProductByIdParams }>,
  reply: FastifyReply
) {
  const product = await getProductById(request.server, request.params.id);
  return reply.send(product);
}
