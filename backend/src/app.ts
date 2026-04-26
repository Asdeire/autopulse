import { FastifyInstance } from "fastify";

import authRoutes from "./modules/auth/routes";
import catalogRoutes from "./modules/catalog/routes";
import ordersRoutes from "./modules/orders/routes";

export async function registerApp(fastify: FastifyInstance): Promise<void> {
  fastify.get("/health", async () => {
    return { status: "ok" };
  });

  await fastify.register(authRoutes, { prefix: "/api" });
  await fastify.register(catalogRoutes, { prefix: "/api" });
  await fastify.register(ordersRoutes, { prefix: "/api" });
}
