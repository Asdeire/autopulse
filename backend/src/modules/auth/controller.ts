import { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, registerUser } from "./service";

type AuthBody = {
  email: string;
  password: string;
};

export async function registerUserController(
  request: FastifyRequest<{ Body: AuthBody }>,
  reply: FastifyReply
) {
  const result = await registerUser(request.server, request.body);
  return reply.code(201).send(result);
}

export async function loginUserController(request: FastifyRequest<{ Body: AuthBody }>) {
  return loginUser(request.server, request.body);
}
