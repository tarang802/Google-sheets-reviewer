import { Router } from "express";
import { verifyCredentials, issueToken, requireAuth } from "../lib/auth.js";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 12 * 60 * 60 * 1000,
};

router.post("/login", (req, res) => {
  const { name, password } = req.body || {};
  if (!name || !password) {
    return res.status(400).json({ error: "Name and password required" });
  }
  if (!verifyCredentials(name, password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = issueToken(name);
  res.cookie("session", token, COOKIE_OPTIONS);
  res.json({ name });
});

router.post("/logout", (req, res) => {
  const { maxAge, ...clearOptions } = COOKIE_OPTIONS;
  res.clearCookie("session", clearOptions);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ name: req.reviewer });
});

export default router;
