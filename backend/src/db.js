import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { config } from "./config.js";

let memoryServer;

export async function connectDb() {
  let uri = config.mongoUri;

  if (!uri && config.allowMemoryDb) {
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "vibeverse" }
    });
    uri = memoryServer.getUri();
    console.log(`Using in-memory MongoDB at ${uri}`);
  }

  if (!uri) {
    throw new Error("No MongoDB URI configured and ALLOW_MEMORY_DB=false");
  }

  await mongoose.connect(uri);
  console.log("Mongo connected");
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
