import Fastify from "fastify";
import cors from "@fastify/cors";

import { registerApp } from "./app";
import { env } from "./config/env";
import prismaPlugin from "./plugins/prisma";
import jwtPlugin from "./plugins/jwt";
import authPlugin from "./plugins/auth";

async function buildServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, { origin: true });
  await fastify.register(prismaPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(authPlugin);
  await registerApp(fastify);

  return fastify;
}

async function start() {
  const server = await buildServer();

  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

void start();
