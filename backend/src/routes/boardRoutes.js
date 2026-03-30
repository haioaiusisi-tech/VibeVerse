import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Board } from "../models/Board.js";
import { Post } from "../models/Post.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const boards = await Board.find({
    $or: [{ owner: req.user._id }, { isPrivate: false }]
  })
    .populate("posts")
    .sort({ updatedAt: -1 });
  res.json({ boards });
});

router.post("/", async (req, res) => {
  const board = await Board.create({
    name: req.body.name,
    description: req.body.description || "",
    isPrivate: Boolean(req.body.isPrivate),
    owner: req.user._id
  });
  res.status(201).json({ board });
});

router.put("/:id", async (req, res) => {
  const board = await Board.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    {
      name: req.body.name,
      description: req.body.description,
      isPrivate: Boolean(req.body.isPrivate)
    },
    { new: true }
  );
  if (!board) {
    return res.status(404).json({ message: "Board not found" });
  }
  res.json({ board });
});

router.delete("/:id", async (req, res) => {
  const board = await Board.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!board) {
    return res.status(404).json({ message: "Board not found" });
  }
  await Post.updateMany({ boardIds: board._id }, { $pull: { boardIds: board._id } });
  res.json({ ok: true });
});

router.post("/:id/posts/:postId", async (req, res) => {
  const board = await Board.findOne({ _id: req.params.id, owner: req.user._id });
  const post = await Post.findById(req.params.postId);
  if (!board || !post) {
    return res.status(404).json({ message: "Board or post not found" });
  }

  if (!board.posts.some((id) => String(id) === String(post._id))) {
    board.posts.push(post._id);
    await board.save();
  }
  if (!post.boardIds.some((id) => String(id) === String(board._id))) {
    post.boardIds.push(board._id);
    await post.save();
  }

  res.json({ board, post });
});

export default router;
