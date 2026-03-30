import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Post } from "../models/Post.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const posts = await Post.find()
    .populate("author", "username avatar bio interests")
    .sort({ createdAt: -1 })
    .limit(100);

  const interestSet = new Set(req.user.interests.map((interest) => interest.toLowerCase()));

  const ranked = posts
    .map((post) => {
      const interestMatches = post.tags.filter((tag) => interestSet.has(tag.toLowerCase())).length;
      const recencyBoost = Math.max(0, 100 - Math.floor((Date.now() - new Date(post.createdAt).getTime()) / 3600000));
      const engagementBoost = post.likes.length * 6 + post.comments.length * 10;
      return {
        post,
        score: interestMatches * 25 + recencyBoost + engagementBoost
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map(({ post, score }) => ({ ...post.toObject(), vibeScore: score }));

  res.json({ posts: ranked });
});

export default router;
