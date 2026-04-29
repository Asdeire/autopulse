import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";

type AddUserVehicleInput = {
  vehicleSpecId: number;
  nickname?: string;
  isPrimary?: boolean;
};

function makeHttpError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

async function clearCurrentPrimary(fastify: FastifyInstance, userId: number) {
  await fastify.prisma.userVehicle.updateMany({
    where: { userId, isPrimary: true },
    data: { isPrimary: false }
  });
}

export async function getVehicleMakes(fastify: FastifyInstance) {
  return fastify.prisma.vehicleMake.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
}

export async function getVehicleModels(fastify: FastifyInstance, makeId: number) {
  return fastify.prisma.vehicleModel.findMany({
    where: { makeId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, makeId: true }
  });
}

export async function getVehicleSpecs(
  fastify: FastifyInstance,
  query: { modelId?: number; makeId?: number; year?: number }
) {
  return fastify.prisma.vehicleSpec.findMany({
    where: {
      ...(query.modelId !== undefined ? { modelId: query.modelId } : {}),
      ...(query.makeId !== undefined ? { makeId: query.makeId } : {}),
      ...(query.year !== undefined ? { yearFrom: { lte: query.year }, yearTo: { gte: query.year } } : {})
    },
    orderBy: [{ make: { name: "asc" } }, { model: { name: "asc" } }, { yearFrom: "desc" }],
    select: {
      id: true,
      yearFrom: true,
      yearTo: true,
      normalizedName: true,
      make: { select: { id: true, name: true } },
      model: { select: { id: true, name: true } },
      engine: { select: { id: true, name: true, code: true } }
    }
  });
}

export async function getMyGarageVehicles(fastify: FastifyInstance, userId: number) {
  return fastify.prisma.userVehicle.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      nickname: true,
      isPrimary: true,
      createdAt: true,
      vehicleSpec: {
        select: {
          id: true,
          yearFrom: true,
          yearTo: true,
          normalizedName: true,
          make: { select: { id: true, name: true } },
          model: { select: { id: true, name: true } },
          engine: { select: { id: true, name: true, code: true } }
        }
      }
    }
  });
}

export async function addMyGarageVehicle(fastify: FastifyInstance, userId: number, input: AddUserVehicleInput) {
  const user = await fastify.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!user) {
    throw makeHttpError("User not found. Please sign in again.", 401);
  }

  const vehicleSpec = await fastify.prisma.vehicleSpec.findUnique({
    where: { id: input.vehicleSpecId },
    select: { id: true }
  });
  if (!vehicleSpec) {
    throw makeHttpError("Vehicle spec not found", 404);
  }

  const exists = await fastify.prisma.userVehicle.findUnique({
    where: {
      userId_vehicleSpecId: {
        userId,
        vehicleSpecId: input.vehicleSpecId
      }
    },
    select: { id: true }
  });
  if (exists) {
    throw makeHttpError("This vehicle already exists in garage", 409);
  }

  const firstVehicle = (await fastify.prisma.userVehicle.count({ where: { userId } })) === 0;
  const shouldSetPrimary = input.isPrimary === true || firstVehicle;

  try {
    return fastify.prisma.$transaction(async (tx) => {
      if (shouldSetPrimary) {
        await tx.userVehicle.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false }
        });
      }

      return tx.userVehicle.create({
        data: {
          userId,
          vehicleSpecId: input.vehicleSpecId,
          nickname: input.nickname?.trim() || null,
          isPrimary: shouldSetPrimary
        },
        select: {
          id: true,
          nickname: true,
          isPrimary: true,
          createdAt: true,
          vehicleSpec: {
            select: {
              id: true,
              yearFrom: true,
              yearTo: true,
              normalizedName: true,
              make: { select: { id: true, name: true } },
              model: { select: { id: true, name: true } },
              engine: { select: { id: true, name: true, code: true } }
            }
          }
        }
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw makeHttpError("Unable to add vehicle: user or vehicle spec no longer exists.", 409);
    }

    throw error;
  }
}

export async function makePrimaryGarageVehicle(
  fastify: FastifyInstance,
  userId: number,
  userVehicleId: number
) {
  const ownVehicle = await fastify.prisma.userVehicle.findFirst({
    where: { id: userVehicleId, userId },
    select: { id: true }
  });
  if (!ownVehicle) {
    throw makeHttpError("Garage vehicle not found", 404);
  }

  await clearCurrentPrimary(fastify, userId);
  return fastify.prisma.userVehicle.update({
    where: { id: userVehicleId },
    data: { isPrimary: true },
    select: {
      id: true,
      nickname: true,
      isPrimary: true,
      createdAt: true,
      vehicleSpec: {
        select: {
          id: true,
          yearFrom: true,
          yearTo: true,
          normalizedName: true,
          make: { select: { id: true, name: true } },
          model: { select: { id: true, name: true } },
          engine: { select: { id: true, name: true, code: true } }
        }
      }
    }
  });
}

export async function removeGarageVehicle(fastify: FastifyInstance, userId: number, userVehicleId: number) {
  const target = await fastify.prisma.userVehicle.findFirst({
    where: { id: userVehicleId, userId },
    select: { id: true, isPrimary: true }
  });
  if (!target) {
    throw makeHttpError("Garage vehicle not found", 404);
  }

  await fastify.prisma.userVehicle.delete({
    where: { id: userVehicleId }
  });

  if (target.isPrimary) {
    const newest = await fastify.prisma.userVehicle.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });
    if (newest) {
      await makePrimaryGarageVehicle(fastify, userId, newest.id);
    }
  }
}

export async function getPrimaryVehicleSpecId(fastify: FastifyInstance, userId: number) {
  const primary = await fastify.prisma.userVehicle.findFirst({
    where: { userId, isPrimary: true },
    select: { vehicleSpecId: true }
  });
  return primary?.vehicleSpecId;
}
