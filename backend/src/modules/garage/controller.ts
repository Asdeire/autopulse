import { FastifyReply, FastifyRequest } from "fastify";
import {
  addMyGarageVehicle,
  getMyGarageVehicles,
  getVehicleMakes,
  getVehicleModels,
  getVehicleSpecs,
  makePrimaryGarageVehicle,
  removeGarageVehicle
} from "./service";

type GetVehicleModelsQuery = { makeId: number };
type GetVehicleSpecsQuery = { makeId?: number; modelId?: number; year?: number };
type AddGarageVehicleBody = { vehicleSpecId: number; nickname?: string; isPrimary?: boolean };
type VehicleParams = { id: number };

export async function getVehicleMakesController(request: FastifyRequest) {
  return getVehicleMakes(request.server);
}

export async function getVehicleModelsController(
  request: FastifyRequest<{ Querystring: GetVehicleModelsQuery }>
) {
  return getVehicleModels(request.server, request.query.makeId);
}

export async function getVehicleSpecsController(
  request: FastifyRequest<{ Querystring: GetVehicleSpecsQuery }>
) {
  return getVehicleSpecs(request.server, request.query);
}

export async function getMyGarageVehiclesController(request: FastifyRequest) {
  return getMyGarageVehicles(request.server, request.user.userId);
}

export async function addMyGarageVehicleController(
  request: FastifyRequest<{ Body: AddGarageVehicleBody }>,
  reply: FastifyReply
) {
  const created = await addMyGarageVehicle(request.server, request.user.userId, request.body);
  return reply.code(201).send(created);
}

export async function makePrimaryGarageVehicleController(
  request: FastifyRequest<{ Params: VehicleParams }>
) {
  return makePrimaryGarageVehicle(request.server, request.user.userId, request.params.id);
}

export async function removeGarageVehicleController(
  request: FastifyRequest<{ Params: VehicleParams }>,
  reply: FastifyReply
) {
  await removeGarageVehicle(request.server, request.user.userId, request.params.id);
  return reply.code(204).send();
}
