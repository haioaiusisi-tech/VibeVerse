import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";
import { Board } from "../models/Board.js";
import { suggestTags } from "../services/tagService.js";
import { storeMedia } from "../services/mediaStorage.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", requireAuth, async (req, res) => {
  const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : new Date();
  const posts = await Post.find({ createdAt: { $lt: cursor } })
    .populate("author", "username avatar bio interests")
    .sort({ createdAt: -1 })
    .limit(15);
  res.json({ posts, nextCursor: posts.at(-1)?.createdAt || null });
});

router.post("/", requireAuth, upload.single("media"), async (req, res) => {
  const boardIds = req.body.boardIds ? JSON.parse(req.body.boardIds) : [];
  const content = req.body.content || "";
  const mediaType = req.body.mediaType || (req.file ? "image" : "text");
  const tags = req.body.tags ? JSON.parse(req.body.tags) : suggestTags(content);
  const mediaUrl = await storeMedia(req.file);

  const post = await Post.create({
    author: req.user._id,
    content,
    mediaType,
    mediaUrl,
    tags,
    boardIds,
    isAnonymous: req.body.isAnonymous === "true"
  });

  await Board.updateMany({ _id: { $in: boardIds } }, { $addToSet: { posts: post._id } });
  const populated = await Post.findById(post._id).populate("author", "username avatar bio interests");
  res.status(201).json({ post: populated });
});

router.put("/:id", requireAuth, upload.single("media"), async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  post.content = req.body.content ?? post.content;
  post.mediaType = req.body.mediaType ?? post.mediaType;
  post.tags = req.body.tags ? JSON.parse(req.body.tags) : post.tags;
  post.isAnonymous = req.body.isAnonymous ? req.body.isAnonymous === "true" : post.isAnonymous;
  if (req.file) {
    post.mediaUrl = await storeMedia(req.file);
  }
  await post.save();
  const populated = await Post.findById(post._id).populate("author", "username avatar bio interests");
  res.json({ post: populated });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const post = await Post.findOneAndDelete({ _id: req.params.id, author: req.user._id });
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  await Board.updateMany({ posts: post._id }, { $pull: { posts: post._id } });
  res.json({ ok: true });
});

router.post("/:id/like", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  const index = post.likes.findIndex((like) => String(like) === String(req.user._id));
  if (index === -1) {
    post.likes.push(req.user._id);
  } else {
    post.likes.splice(index, 1);
  }
  await post.save();
  res.json({ likes: post.likes });
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  post.comments.push({ author: req.user._id, body: req.body.body });
  await post.save();
  const populated = await Post.findById(post._id).populate("comments.author", "username avatar");
  res.status(201).json({ post: populated });
});

router.post("/suggest-tags", requireAuth, async (req, res) => {
  res.json({ tags: suggestTags(req.body.text || "") });
});

export default router;
