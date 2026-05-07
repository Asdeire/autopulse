import { FastifyReply, FastifyRequest } from "fastify";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductById,
  getAdminProducts,
  updateAdminProduct
} from "./service";

type AdminProductBody = {
  title: string;
  description: string;
  brand: string;
  price: number;
  categoryId: number;
  imageUrl?: string | null;
  vehicleSpecIds?: number[];
};

export async function getAdminProductsController(
  request: FastifyRequest<{ Querystring: { search?: string } }>
) {
  return getAdminProducts(request.server, request.query.search);
}

export async function getAdminProductByIdController(
  request: FastifyRequest<{ Params: { id: number } }>
) {
  return getAdminProductById(request.server, request.params.id);
}

export async function createAdminProductController(
  request: FastifyRequest<{ Body: AdminProductBody }>,
  reply: FastifyReply
) {
  const product = await createAdminProduct(request.server, request.body);
  return reply.code(201).send(product);
}

export async function updateAdminProductController(
  request: FastifyRequest<{ Params: { id: number }; Body: AdminProductBody }>
) {
  return updateAdminProduct(request.server, request.params.id, request.body);
}

export async function deleteAdminProductController(
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply
) {
  await deleteAdminProduct(request.server, request.params.id);
  return reply.code(204).send();
}
