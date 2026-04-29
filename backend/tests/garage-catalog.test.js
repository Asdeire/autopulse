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

test("garage CRUD and primary vehicle catalog compatibility", async () => {
  const app = await createServer();

  try {
    const category = await prisma.category.upsert({
      where: { name: "Garage Test Category" },
      update: {},
      create: { name: "Garage Test Category" }
    });

    const compatibleProduct = await prisma.product.upsert({
      where: { title: "Garage Compatible Product" },
      update: {
        description: "Product should match primary vehicle",
        brand: "AutoPulse",
        price: 1000,
        categoryId: category.id
      },
      create: {
        title: "Garage Compatible Product",
        description: "Product should match primary vehicle",
        brand: "AutoPulse",
        price: 1000,
        categoryId: category.id
      }
    });

    await prisma.product.upsert({
      where: { title: "Garage Incompatible Product" },
      update: {
        description: "Product should be filtered out",
        brand: "AutoPulse",
        price: 500,
        categoryId: category.id
      },
      create: {
        title: "Garage Incompatible Product",
        description: "Product should be filtered out",
        brand: "AutoPulse",
        price: 500,
        categoryId: category.id
      }
    });

    const make = await prisma.vehicleMake.upsert({
      where: { name: "GarageTestMake" },
      update: {},
      create: { name: "GarageTestMake" }
    });
    const model = await prisma.vehicleModel.upsert({
      where: { makeId_name: { makeId: make.id, name: "GarageTestModel" } },
      update: {},
      create: { makeId: make.id, name: "GarageTestModel" }
    });
    const engine = await prisma.vehicleEngine.upsert({
      where: { name_code: { name: "GarageEngine", code: "GE-1" } },
      update: {},
      create: { name: "GarageEngine", code: "GE-1" }
    });
    const spec = await prisma.vehicleSpec.upsert({
      where: {
        modelId_engineId_yearFrom_yearTo: {
          modelId: model.id,
          engineId: engine.id,
          yearFrom: 2010,
          yearTo: 2015
        }
      },
      update: {
        makeId: make.id,
        normalizedName: "GarageTestMake GarageTestModel 2010-2015 GarageEngine"
      },
      create: {
        makeId: make.id,
        modelId: model.id,
        engineId: engine.id,
        yearFrom: 2010,
        yearTo: 2015,
        normalizedName: "GarageTestMake GarageTestModel 2010-2015 GarageEngine"
      }
    });

    await prisma.productCompatibility.upsert({
      where: {
        productId_vehicleSpecId: {
          productId: compatibleProduct.id,
          vehicleSpecId: spec.id
        }
      },
      update: { source: "TEST" },
      create: {
        productId: compatibleProduct.id,
        vehicleSpecId: spec.id,
        source: "TEST"
      }
    });

    const email = `garage-${Date.now()}@autopulse.local`;
    const password = "testpass123";
    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password }
    });
    const token = registerResponse.json().token;

    const addVehicleResponse = await app.inject({
      method: "POST",
      url: "/api/garage/vehicles",
      headers: { authorization: `Bearer ${token}` },
      payload: { vehicleSpecId: spec.id, isPrimary: true }
    });
    assert.equal(addVehicleResponse.statusCode, 201);
    const userVehicle = addVehicleResponse.json();
    assert.equal(userVehicle.isPrimary, true);

    const myGarageResponse = await app.inject({
      method: "GET",
      url: "/api/garage/vehicles",
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(myGarageResponse.statusCode, 200);
    assert.equal(myGarageResponse.json().length, 1);

    const compatibleProductsResponse = await app.inject({
      method: "GET",
      url: "/api/products?usePrimaryVehicle=true&onlyCompatible=true",
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(compatibleProductsResponse.statusCode, 200);
    const compatibleProductsPayload = compatibleProductsResponse.json();
    assert.equal(compatibleProductsPayload.items.length, 1);
    assert.equal(compatibleProductsPayload.items[0].title, compatibleProduct.title);
    assert.equal(compatibleProductsPayload.items[0].isCompatible, true);
    assert.equal(compatibleProductsPayload.meta.total, 1);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/garage/vehicles/${userVehicle.id}`,
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(deleteResponse.statusCode, 204);
  } finally {
    await app.close();
  }
});
