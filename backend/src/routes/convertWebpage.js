import { Router } from "express";
import { webpageToPdf } from "../lib/officeConvert.js";
import { assertPublicHttpUrl } from "../lib/urlSafety.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { url } = req.body ?? {};
    if (typeof url !== "string") {
      return res.status(400).json({ error: "Enter a valid http(s) URL." });
    }
    const safeUrl = await assertPublicHttpUrl(url);

    const bytes = await webpageToPdf(safeUrl.toString());
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="webpage.pdf"');
    res.send(bytes);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Conversion failed." });
  }
});

export default router;
