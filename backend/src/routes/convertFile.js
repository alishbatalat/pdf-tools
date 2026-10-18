import { Router } from "express";
import multer from "multer";
import { convertFile } from "../lib/officeConvert.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const router = Router();

function extensionOf(filename) {
  const match = /\.([a-z0-9]+)$/i.exec(filename);
  return match ? match[1].toLowerCase() : "";
}

// docx/xlsx/pptx are ZIP archives under the hood (OOXML). Serving them with
// a generic application/octet-stream Content-Type lets browsers sniff the
// ZIP signature in the bytes and save the download as a .zip instead of
// respecting the intended extension — hence the explicit MIME types here.
const MIME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

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
    const resultExt = extensionOf(result.filename);
    res.setHeader("Content-Type", MIME_TYPES[resultExt] ?? "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(result.bytes);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Conversion failed." });
  }
});

export default router;
