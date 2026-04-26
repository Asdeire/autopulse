import { FastifyPluginAsync } from "fastify";
import {
  getCategoriesController,
  getProductByIdController,
  getProductsController
} from "./controller";

const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/categories", getCategoriesController);

  fastify.get<{
    Querystring: {
      categoryId?: number;
      brand?: string;
      search?: string;
      sortBy?: "price_asc" | "price_desc";
    };
  }>("/products", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          categoryId: { type: "integer", minimum: 1 },
          brand: { type: "string", minLength: 1 },
          search: { type: "string", minLength: 1 },
          sortBy: { type: "string", enum: ["price_asc", "price_desc"] }
        }
      }
    }
  }, getProductsController);

  fastify.get<{
    Params: { id: number };
  }>("/products/:id", {
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", minimum: 1 }
        }
      }
    }
  }, getProductByIdController);
};

export default catalogRoutes;
