import { Router } from "express";
import { translateTextLocal, supportedTranslationLanguages } from "../lib/localAi.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body ?? {};
    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "No document text was provided." });
    }
    if (typeof targetLanguage !== "string" || !supportedTranslationLanguages.includes(targetLanguage)) {
      return res.status(400).json({
        error: `Unsupported target language. Choose one of: ${supportedTranslationLanguages.join(", ")}.`,
      });
    }
    const { translation, truncated } = await translateTextLocal(text, targetLanguage);
    res.json({ translation, truncated });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Couldn't translate this document." });
  }
});

export default router;
