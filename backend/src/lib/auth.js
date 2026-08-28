import jwt from "jsonwebtoken";

function loadReviewers() {
  const raw = process.env.REVIEWERS || "";
  const map = new Map();
  for (const pair of raw.split(",")) {
    const [name, password] = pair.split(":");
    if (name && password) map.set(name.trim(), password.trim());
  }
  return map;
}

export function verifyCredentials(name, password) {
  const reviewers = loadReviewers();
  return reviewers.get(name) === password;
}

export function issueToken(name) {
  return jwt.sign({ name }, process.env.JWT_SECRET, { expiresIn: "12h" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.session;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Not authenticated" });
  req.reviewer = payload.name;
  next();
}
