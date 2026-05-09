const test = require("node:test");
const assert = require("node:assert/strict");
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const multipart = require("@fastify/multipart");

const prismaPlugin = require("../dist/src/plugins/prisma").default;
const jwtPlugin = require("../dist/src/plugins/jwt").default;
const authPlugin = require("../dist/src/plugins/auth").default;
const { registerApp } = require("../dist/src/app");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createServer() {
  const app = Fastify();
  await app.register(cors, { origin: true });
  await app.register(multipart);
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  await app.register(authPlugin);
  await registerApp(app);
  return app;
}

function buildMultipartPayload(fields, file) {
  const boundary = `----autopulse-boundary-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const chunks = [];

  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
          `${value}\r\n`
      )
    );
  }

  if (file) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\n` +
          `Content-Type: ${file.contentType}\r\n\r\n`
      )
    );
    chunks.push(file.content);
    chunks.push(Buffer.from("\r\n"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    payload: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

async function registerAndLogin(app, email, password) {
  const registerResponse = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password }
  });
  assert.equal(registerResponse.statusCode, 201);

  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password }
  });
  assert.equal(loginResponse.statusCode, 200);

  return loginResponse.json();
}

test("admin products CRUD is ADMIN-only and manages compatibility", async () => {
  const app = await createServer();

  try {
    const suffix = Date.now();
    const regularEmail = `regular-${suffix}@autopulse.local`;
    const adminEmail = `admin-${suffix}@autopulse.local`;
    const password = "testpass123";

    const categoryA = await prisma.category.upsert({
      where: { name: `Admin Test Category A ${suffix}` },
      update: {},
      create: { name: `Admin Test Category A ${suffix}` }
    });
    const categoryB = await prisma.category.upsert({
      where: { name: `Admin Test Category B ${suffix}` },
      update: {},
      create: { name: `Admin Test Category B ${suffix}` }
    });

    const make = await prisma.vehicleMake.upsert({
      where: { name: `AdminMake-${suffix}` },
      update: {},
      create: { name: `AdminMake-${suffix}` }
    });
    const model = await prisma.vehicleModel.upsert({
      where: { makeId_name: { makeId: make.id, name: `AdminModel-${suffix}` } },
      update: {},
      create: { makeId: make.id, name: `AdminModel-${suffix}` }
    });
    const engineOne = await prisma.vehicleEngine.upsert({
      where: { name_code: { name: `AdminEngineA-${suffix}`, code: `A-${suffix}` } },
      update: {},
      create: { name: `AdminEngineA-${suffix}`, code: `A-${suffix}` }
    });
    const engineTwo = await prisma.vehicleEngine.upsert({
      where: { name_code: { name: `AdminEngineB-${suffix}`, code: `B-${suffix}` } },
      update: {},
      create: { name: `AdminEngineB-${suffix}`, code: `B-${suffix}` }
    });

    const specOne = await prisma.vehicleSpec.upsert({
      where: {
        modelId_engineId_yearFrom_yearTo: {
          modelId: model.id,
          engineId: engineOne.id,
          yearFrom: 2011,
          yearTo: 2014
        }
      },
      update: {
        makeId: make.id,
        normalizedName: `${make.name} ${model.name} 2011-2014 ${engineOne.name}`
      },
      create: {
        makeId: make.id,
        modelId: model.id,
        engineId: engineOne.id,
        yearFrom: 2011,
        yearTo: 2014,
        normalizedName: `${make.name} ${model.name} 2011-2014 ${engineOne.name}`
      }
    });
    const specTwo = await prisma.vehicleSpec.upsert({
      where: {
        modelId_engineId_yearFrom_yearTo: {
          modelId: model.id,
          engineId: engineTwo.id,
          yearFrom: 2015,
          yearTo: 2018
        }
      },
      update: {
        makeId: make.id,
        normalizedName: `${make.name} ${model.name} 2015-2018 ${engineTwo.name}`
      },
      create: {
        makeId: make.id,
        modelId: model.id,
        engineId: engineTwo.id,
        yearFrom: 2015,
        yearTo: 2018,
        normalizedName: `${make.name} ${model.name} 2015-2018 ${engineTwo.name}`
      }
    });

    const regularLogin = await registerAndLogin(app, regularEmail, password);
    await registerAndLogin(app, adminEmail, password);

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" }
    });

    const adminLoginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: adminEmail, password }
    });
    assert.equal(adminLoginResponse.statusCode, 200);
    const adminLogin = adminLoginResponse.json();
    assert.equal(adminLogin.user.role, "ADMIN");

    let uploadCounter = 0;
    app.imageStorage = {
      uploadProductImage: async () => {
        uploadCounter += 1;
        return `https://res.cloudinary.com/demo/image/upload/autopulse/test-${uploadCounter}.jpg`;
      }
    };

    const forbiddenCreate = await app.inject({
      method: "POST",
      url: "/api/admin/products",
      headers: {
        authorization: `Bearer ${regularLogin.token}`
      },
      payload: {
        title: `Forbidden Product ${suffix}`,
        description: "Should fail for non-admin",
        brand: "AutoPulse",
        price: 10,
        categoryId: categoryA.id,
        vehicleSpecIds: [specOne.id]
      }
    });
    assert.equal(forbiddenCreate.statusCode, 403);

    const createdTitle = `Admin Created Product ${suffix}`;
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/admin/products",
      headers: {
        authorization: `Bearer ${adminLogin.token}`
      },
      payload: {
        title: createdTitle,
        description: "Created by admin panel test",
        brand: "AutoPulse",
        price: 199.99,
        categoryId: categoryA.id,
        imageUrl: null,
        vehicleSpecIds: [specOne.id]
      }
    });
    assert.equal(createResponse.statusCode, 201);
    const createdProduct = createResponse.json();
    assert.equal(createdProduct.title, createdTitle);
    assert.equal(createdProduct.categoryId, categoryA.id);
    assert.equal(createdProduct.imageUrl, "https://via.placeholder.com/800x600?text=AutoPulse+Product");
    assert.deepEqual(createdProduct.vehicleSpecIds, [specOne.id]);

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/admin/products",
      headers: {
        authorization: `Bearer ${adminLogin.token}`
      }
    });
    assert.equal(listResponse.statusCode, 200);
    const listBody = listResponse.json();
    assert.ok(Array.isArray(listBody));
    assert.ok(listBody.some((product) => product.id === createdProduct.id));

    const updatedTitle = `Admin Updated Product ${suffix}`;
    const updateResponse = await app.inject({
      method: "PUT",
      url: `/api/admin/products/${createdProduct.id}`,
      headers: {
        authorization: `Bearer ${adminLogin.token}`
      },
      payload: {
        title: updatedTitle,
        description: "Updated by admin panel test",
        brand: "Brembo",
        price: 250.5,
        categoryId: categoryB.id,
        imageUrl: "",
        vehicleSpecIds: [specTwo.id]
      }
    });
    assert.equal(updateResponse.statusCode, 200);
    const updatedProduct = updateResponse.json();
    assert.equal(updatedProduct.title, updatedTitle);
    assert.equal(updatedProduct.categoryId, categoryB.id);
    assert.deepEqual(updatedProduct.vehicleSpecIds, [specTwo.id]);
    assert.equal(updatedProduct.imageUrl, "https://via.placeholder.com/800x600?text=AutoPulse+Product");

    const createMultipart = buildMultipartPayload(
      {
        title: `Multipart Product ${suffix}`,
        description: "Multipart upload test",
        brand: "CloudinaryBrand",
        price: "300.75",
        categoryId: String(categoryA.id),
        vehicleSpecIds: JSON.stringify([specOne.id])
      },
      {
        fieldName: "image",
        filename: "product.jpg",
        contentType: "image/jpeg",
        content: Buffer.from("fake image data")
      }
    );

    const multipartCreateResponse = await app.inject({
      method: "POST",
      url: "/api/admin/products",
      headers: {
        authorization: `Bearer ${adminLogin.token}`,
        "content-type": createMultipart.contentType
      },
      payload: createMultipart.payload
    });
    assert.equal(multipartCreateResponse.statusCode, 201);
    const multipartCreated = multipartCreateResponse.json();
    assert.equal(multipartCreated.imageUrl, "https://res.cloudinary.com/demo/image/upload/autopulse/test-1.jpg");

    const updateMultipart = buildMultipartPayload(
      {
        title: `Multipart Updated ${suffix}`,
        description: "Multipart update test",
        brand: "CloudinaryBrand",
        price: "333.5",
        categoryId: String(categoryB.id),
        vehicleSpecIds: JSON.stringify([specTwo.id])
      },
      {
        fieldName: "image",
        filename: "product-updated.jpg",
        contentType: "image/jpeg",
        content: Buffer.from("fake image data 2")
      }
    );

    const multipartUpdateResponse = await app.inject({
      method: "PUT",
      url: `/api/admin/products/${multipartCreated.id}`,
      headers: {
        authorization: `Bearer ${adminLogin.token}`,
        "content-type": updateMultipart.contentType
      },
      payload: updateMultipart.payload
    });
    assert.equal(multipartUpdateResponse.statusCode, 200);
    const multipartUpdated = multipartUpdateResponse.json();
    assert.equal(multipartUpdated.imageUrl, "https://res.cloudinary.com/demo/image/upload/autopulse/test-2.jpg");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/admin/products/${createdProduct.id}`,
      headers: {
        authorization: `Bearer ${adminLogin.token}`
      }
    });
    assert.equal(deleteResponse.statusCode, 204);

    const getDeletedResponse = await app.inject({
      method: "GET",
      url: `/api/admin/products/${createdProduct.id}`,
      headers: {
        authorization: `Bearer ${adminLogin.token}`
      }
    });
    assert.equal(getDeletedResponse.statusCode, 404);
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
});
