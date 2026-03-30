import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    mediaUrl: { type: String, default: "" },
    mediaType: { type: String, enum: ["text", "image", "clip"], default: "text" },
    tags: { type: [String], default: [] },
    boardIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Board" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    isAnonymous: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
