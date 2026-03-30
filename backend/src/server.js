import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { connectDb } from "./db.js";
import { config } from "./config.js";
import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();

fs.mkdirSync(config.uploadsDir, { recursive: true });

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.clientUrls.includes("*") || config.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true
  })
);
app.set("trust proxy", 1);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(config.uploadsDir)));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "VibeVerse API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/profiles", profileRoutes);

connectDb()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`VibeVerse API listening on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
