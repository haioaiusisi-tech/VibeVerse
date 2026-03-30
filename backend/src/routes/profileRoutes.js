import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Board } from "../models/Board.js";
import { Post } from "../models/Post.js";

const router = express.Router();

router.use(requireAuth);

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const boards = await Board.find({ owner: user._id }).sort({ updatedAt: -1 });
  const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 }).limit(20);
  res.json({ user, boards, posts });
});

router.put("/me", async (req, res) => {
  const updates = {
    username: req.body.username ?? req.user.username,
    avatar: req.body.avatar ?? req.user.avatar,
    bio: req.body.bio ?? req.user.bio,
    interests: Array.isArray(req.body.interests) ? req.body.interests : req.user.interests
  };
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-passwordHash");
  res.json({ user });
});

router.post("/saved/:postId", async (req, res) => {
  const alreadySaved = req.user.savedPosts.some((postId) => String(postId) === req.params.postId);
  const update = alreadySaved
    ? { $pull: { savedPosts: req.params.postId } }
    : { $addToSet: { savedPosts: req.params.postId } };
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select("-passwordHash");
  res.json({ user });
});

export default router;
