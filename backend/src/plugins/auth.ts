import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: number; email: string; role: UserRole };
    user: { userId: number; email: string; role: UserRole };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    authenticate: () => Promise<void>;
    requireAdmin: () => Promise<void>;
  }
}

const authPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorateRequest("authenticate", async function authenticate() {
    await this.jwtVerify();
  });

  fastify.decorateRequest("requireAdmin", async function requireAdmin() {
    await this.jwtVerify();
    if (this.user.role !== "ADMIN") {
      const error = new Error("Admin access required") as Error & { statusCode?: number };
      error.statusCode = 403;
      throw error;
    }
  });
});

export default authPlugin;
