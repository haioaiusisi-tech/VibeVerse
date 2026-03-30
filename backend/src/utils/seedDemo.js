import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../db.js";
import { User } from "../models/User.js";
import { Board } from "../models/Board.js";
import { Post } from "../models/Post.js";

async function seed() {
  await connectDb();
  await Promise.all([User.deleteMany({}), Board.deleteMany({}), Post.deleteMany({})]);
  const passwordHash = await bcrypt.hash("password123", 10);
  const maya = await User.create({
    email: "maya@vibeverse.app",
    username: "maya",
    passwordHash,
    bio: "Collecting playlists, coffee shops, and city glow.",
    interests: ["music", "travel", "food"]
  });
  const board = await Board.create({
    name: "City Night Vibes",
    description: "Neon corners, late trains, and soundtrack energy.",
    owner: maya._id
  });
  const post = await Post.create({
    author: maya._id,
    content: "Built a midnight playlist for the tram ride home.",
    mediaType: "text",
    tags: ["music", "travel", "night"],
    boardIds: [board._id]
  });
  board.posts.push(post._id);
  await board.save();
  console.log("Seeded demo account: maya@vibeverse.app / password123");
  await mongoose.connection.close();
  await disconnectDb();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
