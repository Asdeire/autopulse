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
    Body: {
      title: string;
      description: string;
      brand: string;
      price: number;
      categoryId: number;
      imageUrl?: string | null;
      vehicleSpecIds?: number[];
    };
  }>("/admin/products", {
    preHandler: [protectAdmin],
    schema: {
      body: {
        type: "object",
        required: ["title", "description", "brand", "price", "categoryId"],
        properties: {
          title: { type: "string", minLength: 1 },
          description: { type: "string", minLength: 1 },
          brand: { type: "string", minLength: 1 },
          price: { type: "number", exclusiveMinimum: 0 },
          categoryId: { type: "integer", minimum: 1 },
          imageUrl: { type: ["string", "null"] },
          vehicleSpecIds: {
            type: "array",
            items: { type: "integer", minimum: 1 },
            uniqueItems: true
          }
        }
      }
    }
  }, createAdminProductController);

  fastify.put<{
    Params: { id: number };
    Body: {
      title: string;
      description: string;
      brand: string;
      price: number;
      categoryId: number;
      imageUrl?: string | null;
      vehicleSpecIds?: number[];
    };
  }>("/admin/products/:id", {
    preHandler: [protectAdmin],
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", minimum: 1 }
        }
      },
      body: {
        type: "object",
        required: ["title", "description", "brand", "price", "categoryId"],
        properties: {
          title: { type: "string", minLength: 1 },
          description: { type: "string", minLength: 1 },
          brand: { type: "string", minLength: 1 },
          price: { type: "number", exclusiveMinimum: 0 },
          categoryId: { type: "integer", minimum: 1 },
          imageUrl: { type: ["string", "null"] },
          vehicleSpecIds: {
            type: "array",
            items: { type: "integer", minimum: 1 },
            uniqueItems: true
          }
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
