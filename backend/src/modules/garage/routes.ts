import { FastifyPluginAsync } from "fastify";
import {
  addMyGarageVehicleController,
  getMyGarageVehiclesController,
  getVehicleMakesController,
  getVehicleModelsController,
  getVehicleSpecsController,
  makePrimaryGarageVehicleController,
  removeGarageVehicleController
} from "./controller";

const garageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/vehicles/makes", getVehicleMakesController);

  fastify.get<{
    Querystring: { makeId: number };
  }>("/vehicles/models", {
    schema: {
      querystring: {
        type: "object",
        required: ["makeId"],
        properties: {
          makeId: { type: "integer", minimum: 1 }
        }
      }
    }
  }, getVehicleModelsController);

  fastify.get<{
    Querystring: { makeId?: number; modelId?: number; year?: number };
  }>("/vehicles/specs", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          makeId: { type: "integer", minimum: 1 },
          modelId: { type: "integer", minimum: 1 },
          year: { type: "integer", minimum: 1950 }
        }
      }
    }
  }, getVehicleSpecsController);

  fastify.get("/garage/vehicles", {
    preHandler: [async (request) => request.authenticate()]
  }, getMyGarageVehiclesController);

  fastify.post<{
    Body: { vehicleSpecId: number; nickname?: string; isPrimary?: boolean };
  }>("/garage/vehicles", {
    preHandler: [async (request) => request.authenticate()],
    schema: {
      body: {
        type: "object",
        required: ["vehicleSpecId"],
        properties: {
          vehicleSpecId: { type: "integer", minimum: 1 },
          nickname: { type: "string", minLength: 1, maxLength: 80 },
          isPrimary: { type: "boolean" }
        }
      }
    }
  }, addMyGarageVehicleController);

  fastify.patch<{
    Params: { id: number };
  }>("/garage/vehicles/:id/primary", {
    preHandler: [async (request) => request.authenticate()],
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "integer", minimum: 1 } }
      }
    }
  }, makePrimaryGarageVehicleController);

  fastify.delete<{
    Params: { id: number };
  }>("/garage/vehicles/:id", {
    preHandler: [async (request) => request.authenticate()],
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "integer", minimum: 1 } }
      }
    }
  }, removeGarageVehicleController);
};

export default garageRoutes;
