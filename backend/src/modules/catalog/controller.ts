import { FastifyReply, FastifyRequest } from "fastify";
import { getCategories, getProductById, getProducts, getRecommendedProducts } from "./service";
import { getPrimaryVehicleSpecId } from "../garage/service";

type GetProductsQuery = {
  categoryId?: number;
  brand?: string;
  search?: string;
  sortBy?: "price_asc" | "price_desc";
  vehicleSpecId?: number;
  usePrimaryVehicle?: boolean;
  onlyCompatible?: boolean;
  page?: number;
  pageSize?: number;
};

type GetProductByIdParams = {
  id: number;
};

type GetProductByIdQuery = {
  vehicleSpecId?: number;
  usePrimaryVehicle?: boolean;
};

async function resolveVehicleSpecId(
  request: FastifyRequest<{ Querystring: { vehicleSpecId?: number; usePrimaryVehicle?: boolean } }>
) {
  if (request.query.vehicleSpecId !== undefined) {
    return request.query.vehicleSpecId;
  }
  if (!request.query.usePrimaryVehicle) {
    return undefined;
  }

  try {
    await request.jwtVerify();
    return getPrimaryVehicleSpecId(request.server, request.user.userId);
  } catch {
    return undefined;
  }
}

export async function getCategoriesController(request: FastifyRequest) {
  return getCategories(request.server);
}

export async function getProductsController(
  request: FastifyRequest<{ Querystring: GetProductsQuery }>
) {
  const vehicleSpecId = await resolveVehicleSpecId(
    request as FastifyRequest<{ Querystring: { vehicleSpecId?: number; usePrimaryVehicle?: boolean } }>
  );

  return getProducts(request.server, {
    ...request.query,
    vehicleSpecId
  });
}

export async function getProductByIdController(
  request: FastifyRequest<{ Params: GetProductByIdParams; Querystring: GetProductByIdQuery }>,
  reply: FastifyReply
) {
  const vehicleSpecId = await resolveVehicleSpecId(
    request as FastifyRequest<{ Querystring: { vehicleSpecId?: number; usePrimaryVehicle?: boolean } }>
  );
  const product = await getProductById(request.server, request.params.id, vehicleSpecId);
  return reply.send(product);
}

export async function getRecommendedProductsController(
  request: FastifyRequest<{ Params: GetProductByIdParams; Querystring: { limit?: number } }>,
  reply: FastifyReply
) {
  const products = await getRecommendedProducts(request.server, request.params.id, request.query.limit);
  return reply.send(products);
}
