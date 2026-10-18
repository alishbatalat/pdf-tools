import "dotenv/config";
import express from "express";
import cors from "cors";
import summarizeRoute from "./src/routes/summarize.js";
import translateRoute from "./src/routes/translate.js";
import chatPdfRoute from "./src/routes/chatPdf.js";
import convertFileRoute from "./src/routes/convertFile.js";
import convertWebpageRoute from "./src/routes/convertWebpage.js";

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
  }),
);
app.use(express.json({ limit: "15mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/summarize", summarizeRoute);
app.use("/api/translate", translateRoute);
app.use("/api/chat-pdf", chatPdfRoute);
app.use("/api/convert-file", convertFileRoute);
app.use("/api/convert-webpage", convertWebpageRoute);

// Multer and JSON parsing errors land here (e.g. file too large, bad JSON body).
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`pdf-tools backend listening on http://localhost:${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
