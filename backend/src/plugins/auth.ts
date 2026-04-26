import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: number; email: string };
    user: { userId: number; email: string };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    authenticate: () => Promise<void>;
  }
}

const authPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorateRequest("authenticate", async function authenticate() {
    await this.jwtVerify();
  });
});

export default authPlugin;
