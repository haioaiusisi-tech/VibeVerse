import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    interests: { type: [String], default: [] },
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }]
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
