import { Router } from "express";
import multer from "multer";
import { convertFile } from "../lib/officeConvert.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

function extensionOf(filename) {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  return match ? match[1].toLowerCase() : "";
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const outputFormat = req.body?.outputFormat;
    if (!file || typeof outputFormat !== "string" || !outputFormat) {
      return res.status(400).json({ error: "Missing file or outputFormat." });
    }
    const inputFormat = extensionOf(file.originalname);
    if (!inputFormat) {
      return res.status(400).json({ error: "Couldn't determine the file's format." });
    }

    const result = await convertFile(file.buffer, file.originalname, inputFormat, outputFormat);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(result.bytes);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Conversion failed." });
  }
});

export default router;
