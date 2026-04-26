const test = require("node:test");
const assert = require("node:assert/strict");
const Fastify = require("fastify");
const cors = require("@fastify/cors");

const prismaPlugin = require("../dist/src/plugins/prisma").default;
const jwtPlugin = require("../dist/src/plugins/jwt").default;
const authPlugin = require("../dist/src/plugins/auth").default;
const { registerApp } = require("../dist/src/app");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createServer() {
  const app = Fastify();
  await app.register(cors, { origin: true });
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  await app.register(authPlugin);
  await registerApp(app);
  return app;
}

test("register -> login -> create order -> get my orders", async () => {
  const app = await createServer();

  try {
    const category = await prisma.category.upsert({
      where: { name: "Test Category Integration" },
      update: {},
      create: { name: "Test Category Integration" }
    });

    const product = await prisma.product.upsert({
      where: { title: "Test Product Integration" },
      update: {
        description: "Integration test product",
        brand: "AutoPulse",
        price: 125.5,
        categoryId: category.id
      },
      create: {
        title: "Test Product Integration",
        description: "Integration test product",
        brand: "AutoPulse",
        price: 125.5,
        categoryId: category.id
      }
    });

    const email = `integration-${Date.now()}@autopulse.local`;
    const password = "testpass123";

    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password }
    });

    assert.equal(registerResponse.statusCode, 201);
    const registerBody = registerResponse.json();
    assert.ok(registerBody.token);
    assert.equal(registerBody.user.email, email);

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password }
    });

    assert.equal(loginResponse.statusCode, 200);
    const loginBody = loginResponse.json();
    assert.ok(loginBody.token);

    const createOrderResponse = await app.inject({
      method: "POST",
      url: "/api/orders",
      headers: {
        authorization: `Bearer ${loginBody.token}`
      },
      payload: {
        items: [{ productId: product.id, quantity: 3 }]
      }
    });

    assert.equal(createOrderResponse.statusCode, 201);
    const createdOrder = createOrderResponse.json();
    assert.equal(createdOrder.totalPrice, 376.5);
    assert.equal(createdOrder.items.length, 1);
    assert.equal(createdOrder.items[0].quantity, 3);
    assert.equal(createdOrder.items[0].unitPrice, 125.5);

    const myOrdersResponse = await app.inject({
      method: "GET",
      url: "/api/orders/my",
      headers: {
        authorization: `Bearer ${loginBody.token}`
      }
    });

    assert.equal(myOrdersResponse.statusCode, 200);
    const myOrders = myOrdersResponse.json();
    assert.ok(Array.isArray(myOrders));
    assert.ok(myOrders.length >= 1);
    assert.equal(myOrders[0].id, createdOrder.id);
  } finally {
    await app.close();
  }
});
