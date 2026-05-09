import { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  createAdminProductController,
  deleteAdminProductController,
  getAdminProductByIdController,
  getAdminProductsController,
  updateAdminProductController
} from "./controller";

const adminProductsRoutes: FastifyPluginAsync = async (fastify) => {
  const protectAdmin = async (request: FastifyRequest) => {
    await request.requireAdmin();
  };

  fastify.get<{
    Querystring: { search?: string };
  }>("/admin/products", {
    preHandler: [protectAdmin],
    schema: {
      querystring: {
        type: "object",
        properties: {
          search: { type: "string", minLength: 1 }
        }
      }
    }
  }, getAdminProductsController);

  fastify.get<{
    Params: { id: number };
  }>("/admin/products/:id", {
    preHandler: [protectAdmin],
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", minimum: 1 }
        }
      }
    }
  }, getAdminProductByIdController);

  fastify.post<{
    Body: unknown;
  }>("/admin/products", {
    preHandler: [protectAdmin],
    schema: {}
  }, createAdminProductController);

  fastify.put<{
    Params: { id: number };
    Body: unknown;
  }>("/admin/products/:id", {
    preHandler: [protectAdmin],
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", minimum: 1 }
        }
      }
    }
  }, updateAdminProductController);

  fastify.delete<{
    Params: { id: number };
  }>("/admin/products/:id", {
    preHandler: [protectAdmin],
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", minimum: 1 }
        }
      }
    }
  }, deleteAdminProductController);
};

export default adminProductsRoutes;
