# Implementation Plan — Foldero

> Name check: no existing live PDF-tool site found under "Foldero" as of Oct 2026 (closest matches were unrelated products). Verify domain availability directly on a registrar before committing.

> **Scope update:** Phase 5 (self-hosted LibreOffice) is dropped. Office<->PDF conversion now goes through free-tier cloud APIs instead (see "Revised scope" below), which means no Docker/LibreOffice server is needed at all for the current build target: Organize PDF, Convert to PDF, Convert from PDF, AI features.

## Revised scope — free tools/APIs per feature

### Organize PDF (fully free, self-hosted, no limits)
- `pikepdf` (recommended, wraps qpdf) or `pypdf`

### Convert TO PDF
- Images -> PDF: `img2pdf` (free, local)
- HTML/webpage -> PDF: `WeasyPrint` or Playwright print-to-PDF (free, local)
- TXT/CSV/RTF -> PDF: `reportlab`, or via the HTML->PDF path
- Office (docx/xlsx/pptx) -> PDF: **CloudConvert** (free tier ~10-25 conversions/day, verify at cloudconvert.com/pricing) or **PDF.co** (10,000 free signup credits, one-time)

### Convert FROM PDF
- PDF -> JPG/PNG: `PyMuPDF` (fitz) -- free, excellent
- PDF -> Text: `PyMuPDF` or `pypdf` -- free, excellent
- PDF -> Word: `pdf2docx` -- free, decent on simple layouts
- PDF -> Excel: `camelot-py` or `pdfplumber` -- free, needs real tabular structure
- PDF -> PowerPoint: no good free library; fallback is PyMuPDF page-render-to-image + `python-pptx` slide backgrounds (not editable text)
- Better quality fallback for any of the above: CloudConvert / PDF.co free tiers

### AI features (summarize / translate / chat with PDF)
- Text extraction: `PyMuPDF` (free, local)
- LLM call: **Google Gemini API** (genuine ongoing free tier, Flash/Flash-Lite, rate-limited -- check current limits in Google AI Studio) or **Ollama self-hosted** (fully free, unlimited, needs real CPU/GPU) or **Hugging Face Inference API** (free tier, rate-limited)
- Claude/OpenAI: no meaningful recurring free tier, revisit once there's revenue

**Caveat:** all free tiers above are dev/low-volume allowances. At real traffic, budget for paid CloudConvert/PDF.co/Gemini tiers or move high-volume conversions to a self-hosted engine later.

## Tech stack

- **Frontend:** Next.js + TypeScript + Tailwind. One URL per tool (`/merge-pdf`, `/compress-pdf`, ...) for SEO — every competitor in feature_matrix.md does this.
- **Backend:** Python + FastAPI. Strongest library ecosystem for PDF/Office/OCR work.
- **Storage:** local temp disk (swap for S3 later), hard TTL delete after ~1 hour. This is the top trust signal these sites market on.
- **Deployment:** Docker image with LibreOffice + Tesseract + Ghostscript baked in → Railway/Render/Fly.io for MVP, move to a VPS once traffic justifies it.

## Phases

**Phase 1 — Core page ops** (no external engine, ship first)
Merge, Split, Rotate, Reorder, Extract/Delete pages, Crop.
Library: `pikepdf` (wraps qpdf, robust) or `pypdf` (pure Python, simpler API).

**Phase 2 — Compress & Repair**
Compress: Ghostscript (`gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook`) or recompress embedded images with Pillow via pikepdf.
Repair: `qpdf --repair` or Ghostscript rebuild.

**Phase 3 — Image ↔ PDF**
JPG/PNG → PDF: `img2pdf`. PDF → JPG/PNG: `PyMuPDF` (fitz) or `pdf2image` (needs Poppler).

**Phase 4 — Security**
Protect/Unlock: `pikepdf` password encrypt/decrypt.
Watermark/Page numbers: overlay generated with `reportlab`, merged in with pikepdf.

**Phase 5 — Office ↔ PDF** (hardest phase)
- Office → PDF: self-host via LibreOffice headless: `soffice --headless --convert-to pdf --outdir /tmp input.docx`. Covers docx/xlsx/pptx/odt/rtf/txt reliably and free.
- PDF → Office (editable Word/Excel/PPT): open-source quality is weak and users notice bad output immediately. Start with a paid API (CloudConvert, Aspose, Adobe PDF Services) for this direction; build your own only once volume justifies it.

**Phase 6 — OCR**
`ocrmypdf` (wraps Tesseract) adds a searchable text layer to scans, handles deskew too: `ocrmypdf input.pdf output.pdf`.

**Phase 7 — Sign PDF**
Frontend: canvas to draw a signature, or type/upload one.
Backend: stamp the signature image onto the page (same overlay technique as watermarks).

**Phase 8 — Trust & polish**
Auto-delete files after ~1hr, per-plan file-size limits, corrupt-file error handling, rate limiting, HTTPS, a real privacy policy about temp storage.

**Phase 9 — Accounts & monetization**
Auth: Clerk or NextAuth. Payments: Stripe for batch processing / bigger limits / API access, enforced server-side on the free tier.

**Phase 10 — AI features** (the actual differentiator)
Summarize/translate/chat-with-PDF: extract text (PyMuPDF) → send to an LLM API → return result. Newer to this market than the core tools — the one area to genuinely stand out rather than match competitors feature-for-feature.

## Suggested pacing

| Weeks | Phases | Outcome |
|---|---|---|
| 1-2 | 1-2 | Usable MVP (merge/split/rotate/compress) |
| 3 | 3-4 | Images + security |
| 4-5 | 5 | Office conversion (hardest) |
| 6 | 6-7 | OCR + e-sign |
| 7+ | 8-10 | Polish, monetization, AI differentiation |
