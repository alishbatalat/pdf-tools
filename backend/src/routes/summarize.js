import { Router } from "express";
import { summarizeTextLocal } from "../lib/localAi.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body ?? {};
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "No document text was provided." });
    }
    const { summary, truncated } = await summarizeTextLocal(text);
    res.json({ summary, truncated });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Couldn't summarize this document." });
  }
});

export default router;
