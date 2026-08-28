import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { getSubmissions, setDecision } from "../lib/sheets.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const submissions = await getSubmissions();
    res.json({ submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load submissions" });
  }
});

router.post("/:row/decision", requireAuth, async (req, res) => {
  const rowNumber = Number(req.params.row);
  const { decision } = req.body || {};
  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    return res.status(400).json({ error: "Invalid row" });
  }
  if (!["ACCEPTED", "REJECTED", "PENDING"].includes(decision)) {
    return res.status(400).json({ error: "Invalid decision" });
  }
  try {
    const result = await setDecision(rowNumber, decision, req.reviewer);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save decision" });
  }
});

export default router;
