import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env";

export type UploadedImageInput = {
  buffer: Buffer;
  filename?: string;
  mimetype?: string;
};

export type ImageStorage = {
  uploadProductImage: (input: UploadedImageInput) => Promise<string>;
};

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizePublicId(filename: string | undefined): string | undefined {
  if (!filename) {
    return undefined;
  }

  const withoutExtension = filename.replace(/\.[^/.]+$/, "");
  const normalized = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || undefined;
}

function ensureCloudinaryConfig() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    const error = new Error("Image upload service is not configured") as Error & { statusCode?: number };
    error.statusCode = 500;
    throw error;
  }
}

function validateImage(input: UploadedImageInput) {
  if (!input.buffer.length) {
    const error = new Error("Uploaded image is empty") as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  if (input.buffer.length > MAX_IMAGE_SIZE_BYTES) {
    const error = new Error("Image is too large. Maximum size is 5MB") as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  if (input.mimetype && !ALLOWED_IMAGE_MIME_TYPES.has(input.mimetype.toLowerCase())) {
    const error = new Error("Unsupported image format") as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }
}

export function createCloudinaryImageStorage(): ImageStorage {
  return {
    async uploadProductImage(input: UploadedImageInput): Promise<string> {
      ensureCloudinaryConfig();
      validateImage(input);

      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true
      });

      const uploaded = await cloudinary.uploader.upload(`data:${input.mimetype ?? "image/jpeg"};base64,${input.buffer.toString("base64")}`, {
        folder: env.CLOUDINARY_FOLDER || "autopulse/products",
        public_id: sanitizePublicId(input.filename),
        overwrite: false,
        resource_type: "image"
      });

      return uploaded.secure_url;
    }
  };
}
