import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const rootDir = path.resolve(__dirname, "..");

const clientUrls = (process.env.CLIENT_URL || "*")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || "super-secret-vibeverse-key",
  mongoUri: process.env.MONGODB_URI || "",
  allowMemoryDb: process.env.ALLOW_MEMORY_DB !== "false",
  clientUrls,
  uploadsDir: path.resolve(rootDir, "uploads"),
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || ""
  }
};
