import fs from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { nanoid } from "nanoid";
import { config } from "../config.js";

const hasCloudinaryConfig =
  Boolean(config.cloudinary.cloudName) &&
  Boolean(config.cloudinary.apiKey) &&
  Boolean(config.cloudinary.apiSecret);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });
}

function mimeToResourceType(mimeType = "") {
  return mimeType.startsWith("video/") ? "video" : "image";
}

function toPublicUrl(relativePath) {
  return new URL(relativePath, config.appBaseUrl).toString();
}

async function saveLocalFile(file) {
  await fs.mkdir(config.uploadsDir, { recursive: true });
  const extension = path.extname(file.originalname || "") || (file.mimetype.startsWith("video/") ? ".mp4" : ".png");
  const fileName = `${Date.now()}-${nanoid(6)}${extension}`;
  const target = path.join(config.uploadsDir, fileName);
  await fs.writeFile(target, file.buffer);
  return toPublicUrl(`/uploads/${fileName}`);
}

async function uploadToCloudinary(file) {
  const base64 = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${base64}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "vibeverse/posts",
    resource_type: mimeToResourceType(file.mimetype)
  });
  return result.secure_url;
}

export async function storeMedia(file) {
  if (!file) {
    return "";
  }

  if (hasCloudinaryConfig) {
    return uploadToCloudinary(file);
  }

  return saveLocalFile(file);
}

export function isCloudStorageEnabled() {
  return hasCloudinaryConfig;
}
