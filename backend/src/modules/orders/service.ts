import { FastifyInstance } from "fastify";

type CreateOrderItemInput = {
  productId: number;
  quantity: number;
};

type CreateOrderInput = {
  items: CreateOrderItemInput[];
};

function makeHttpError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

export async function createOrder(fastify: FastifyInstance, userId: number, input: CreateOrderInput) {
  if (input.items.length === 0) {
    throw makeHttpError("Order must contain at least one item", 400);
  }

  const quantityByProductId = new Map<number, number>();
  for (const item of input.items) {
    const current = quantityByProductId.get(item.productId) ?? 0;
    quantityByProductId.set(item.productId, current + item.quantity);
  }

  const productIds = Array.from(quantityByProductId.keys());
  const products = await fastify.prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      title: true,
      price: true
    }
  });

  if (products.length !== productIds.length) {
    const existingIds = new Set(products.map((product) => product.id));
    const missingIds = productIds.filter((id) => !existingIds.has(id));
    throw makeHttpError(`Products not found: ${missingIds.join(", ")}`, 404);
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const itemsToCreate = productIds.map((productId) => {
    const product = productById.get(productId)!;
    const quantity = quantityByProductId.get(productId)!;
    return {
      productId,
      quantity,
      unitPrice: product.price
    };
  });

  const totalPrice = itemsToCreate.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const order = await fastify.prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId,
        status: "PENDING",
        totalPrice
      }
    });

    await tx.orderItem.createMany({
      data: itemsToCreate.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });

    return tx.order.findUnique({
      where: { id: createdOrder.id },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                title: true,
                brand: true
              }
            }
          }
        }
      }
    });
  });

  return order;
}

export async function getMyOrders(fastify: FastifyInstance, userId: number) {
  return fastify.prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          product: {
            select: {
              title: true,
              brand: true
            }
          }
        }
      }
    }
  });
}
