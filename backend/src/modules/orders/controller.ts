import { FastifyReply, FastifyRequest } from "fastify";
import { createOrder, getMyOrders } from "./service";

type CreateOrderBody = {
  items: Array<{ productId: number; quantity: number }>;
};

export async function createOrderController(
  request: FastifyRequest<{ Body: CreateOrderBody }>,
  reply: FastifyReply
) {
  const order = await createOrder(request.server, request.user.userId, request.body);
  return reply.code(201).send(order);
}

export async function getMyOrdersController(request: FastifyRequest) {
  return getMyOrders(request.server, request.user.userId);
}
