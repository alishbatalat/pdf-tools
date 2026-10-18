import { Router } from "express";
import { chatAboutDocumentLocal } from "../lib/localAi.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { documentText, history } = req.body ?? {};
    if (typeof documentText !== "string" || !documentText.trim()) {
      return res.status(400).json({ error: "No document text was provided." });
    }
    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: "No question was provided." });
    }
    const { answer } = await chatAboutDocumentLocal(documentText, history);
    res.json({ answer });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Couldn't answer that question." });
  }
});

export default router;
