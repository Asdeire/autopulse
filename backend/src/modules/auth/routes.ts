import { FastifyPluginAsync } from "fastify";
import { loginUserController, registerUserController } from "./controller";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: { email: string; password: string };
  }>("/auth/register", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 }
        }
      }
    }
  }, registerUserController);

  fastify.post<{
    Body: { email: string; password: string };
  }>("/auth/login", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 }
        }
      }
    }
  }, loginUserController);
};

export default authRoutes;
