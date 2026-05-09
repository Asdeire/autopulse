import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";

import { createCloudinaryImageStorage, ImageStorage } from "../services/cloudinary";

declare module "fastify" {
  interface FastifyInstance {
    imageStorage: ImageStorage;
  }
}

const imageStoragePlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate("imageStorage", createCloudinaryImageStorage());
});

export default imageStoragePlugin;
