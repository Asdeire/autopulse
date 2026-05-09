import { FastifyReply, FastifyRequest } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductById,
  getAdminProducts,
  updateAdminProduct
} from "./service";

type UploadedImage = {
  buffer: Buffer;
  filename?: string;
  mimetype?: string;
};

type RawAdminProductBody = {
  title?: unknown;
  description?: unknown;
  brand?: unknown;
  price?: unknown;
  categoryId?: unknown;
  imageUrl?: unknown;
  vehicleSpecIds?: unknown;
  image?: UploadedImage | null;
};

type AdminProductBody = {
  title: string;
  description: string;
  brand: string;
  price: number;
  categoryId: number;
  imageUrl?: string | null;
  vehicleSpecIds?: number[];
  image?: UploadedImage | null;
};

function makeHttpError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value);
  }
  return Number.NaN;
}

function parseVehicleSpecIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((entry) => Number(entry));
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return [];
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(normalized) as unknown;
    } catch {
      throw makeHttpError("vehicleSpecIds must be a valid JSON array", 400);
    }
    if (!Array.isArray(parsed)) {
      throw makeHttpError("vehicleSpecIds must be an array", 400);
    }
    return parsed.map((entry) => Number(entry));
  }

  if (value == null) {
    return [];
  }

  throw makeHttpError("vehicleSpecIds must be an array", 400);
}

function normalizeInput(input: RawAdminProductBody): AdminProductBody {
  const title = typeof input.title === "string" ? input.title : "";
  const description = typeof input.description === "string" ? input.description : "";
  const brand = typeof input.brand === "string" ? input.brand : "";
  const price = toNumber(input.price);
  const categoryId = toNumber(input.categoryId);
  const vehicleSpecIds = parseVehicleSpecIds(input.vehicleSpecIds);
  const imageUrl = typeof input.imageUrl === "string" ? input.imageUrl : null;

  if (!title.trim() || !description.trim() || !brand.trim()) {
    throw makeHttpError("title, description and brand are required", 400);
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw makeHttpError("price must be greater than 0", 400);
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw makeHttpError("categoryId must be a positive integer", 400);
  }
  if (!vehicleSpecIds.every((id) => Number.isInteger(id) && id > 0)) {
    throw makeHttpError("vehicleSpecIds must contain positive integer IDs", 400);
  }

  return {
    title,
    description,
    brand,
    price,
    categoryId,
    imageUrl,
    vehicleSpecIds,
    image: input.image ?? null
  };
}

async function parseMultipartBody(
  request: FastifyRequest
): Promise<RawAdminProductBody> {
  const fields: Record<string, unknown> = {};
  let image: UploadedImage | null = null;

  for await (const part of request.parts()) {
    if (part.type === "file") {
      const filePart = part as MultipartFile;
      if (filePart.fieldname !== "image") {
        await filePart.toBuffer();
        continue;
      }

      const buffer = await filePart.toBuffer();
      image = {
        buffer,
        filename: filePart.filename,
        mimetype: filePart.mimetype
      };
      continue;
    }

    fields[part.fieldname] = part.value;
  }

  return { ...fields, image };
}

async function parseAdminProductBody(request: FastifyRequest<{ Body: unknown }>): Promise<AdminProductBody> {
  if (request.isMultipart()) {
    const multipartBody = await parseMultipartBody(request);
    return normalizeInput(multipartBody);
  }

  const body = (request.body ?? {}) as RawAdminProductBody;
  return normalizeInput(body);
}

export async function getAdminProductsController(
  request: FastifyRequest<{ Querystring: { search?: string } }>
) {
  return getAdminProducts(request.server, request.query.search);
}

export async function getAdminProductByIdController(
  request: FastifyRequest<{ Params: { id: number } }>
) {
  return getAdminProductById(request.server, request.params.id);
}

export async function createAdminProductController(
  request: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const body = await parseAdminProductBody(request);
  const product = await createAdminProduct(request.server, body);
  return reply.code(201).send(product);
}

export async function updateAdminProductController(
  request: FastifyRequest<{ Params: { id: number }; Body: unknown }>
) {
  const body = await parseAdminProductBody(request);
  return updateAdminProduct(request.server, request.params.id, body);
}

export async function deleteAdminProductController(
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply
) {
  await deleteAdminProduct(request.server, request.params.id);
  return reply.code(204).send();
}
