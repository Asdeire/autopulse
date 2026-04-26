import { FastifyPluginAsync } from "fastify";
import { createOrderController, getMyOrdersController } from "./controller";

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: { items: Array<{ productId: number; quantity: number }> };
  }>("/orders", {
    preHandler: [async (request) => request.authenticate()],
    schema: {
      body: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: { type: "integer", minimum: 1 },
                quantity: { type: "integer", minimum: 1 }
              }
            }
          }
        }
      }
    }
  }, createOrderController);

  fastify.get("/orders/my", {
    preHandler: [async (request) => request.authenticate()]
  }, getMyOrdersController);
};

export default ordersRoutes;
