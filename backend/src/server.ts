import Fastify from "fastify";
import cors from "@fastify/cors";

import { registerApp } from "./app";
import { env } from "./config/env";
import prismaPlugin from "./plugins/prisma";
import jwtPlugin from "./plugins/jwt";
import authPlugin from "./plugins/auth";

async function buildServer() {
  const fastify = Fastify({ logger: true });

  const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173"
  ];
  const configuredOrigins = (env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

  await fastify.register(cors, {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.has(origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400
  });
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
