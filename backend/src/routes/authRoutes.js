import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Board } from "../models/Board.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { serializeUser } from "../utils/serializers.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user._id }, config.jwtSecret, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ message: "email, password and username are required" });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ message: "Email or username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, username });
    const starterBoard = await Board.create({
      name: `${username}'s vibes`,
      description: "Starter board",
      owner: user._id
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: serializeUser(user, [starterBoard])
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const boards = await Board.find({ owner: user._id }).sort({ updatedAt: -1 });
    res.json({ token: signToken(user), user: serializeUser(user, boards) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const boards = await Board.find({ owner: req.user._id }).sort({ updatedAt: -1 });
  res.json({ user: serializeUser(req.user, boards) });
});

export default router;
