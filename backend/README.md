# pdf-tools backend

A self-hosted Node.js/Express backend for the pdf-tools frontend. No third-party
API keys, no cloud services — AI features run small local models, and document
conversion is done with pure-JS/WASM libraries.

## What it does

| Route | Purpose | How |
|---|---|---|
| `POST /api/summarize` | Summarize document text | Local model (`Xenova/distilbart-cnn-6-6`) via `@huggingface/transformers` |
| `POST /api/translate` | Translate document text | Local model (`Xenova/nllb-200-distilled-600M`) |
| `POST /api/chat-pdf` | Q&A over a document | Extractive QA model (`Xenova/distilbert-base-cased-distilled-squad`) + keyword retrieval |
| `POST /api/convert-file` | Word/Excel/PowerPoint ⇄ PDF | `mammoth`, `exceljs`, `pdfkit`, `docx`, `pdfjs-dist` — no LibreOffice |
| `POST /api/convert-webpage` | Webpage → PDF | `cheerio` + `pdfkit` ("reader view", not pixel-perfect) |

**Trade-off to know up front:** none of this calls LibreOffice, Chromium, or
any cloud AI API, so it works on hosting that can't install system binaries.
In exchange, quality is "good enough," not pixel-perfect — Office conversions
reproduce text/headings/lists/bold/italic/basic tables but not exact layout,
fonts, or embedded objects; PowerPoint→PDF is text-only (no shapes/images);
legacy `.xls`/`.ppt` (pre-2007 binary formats) aren't supported at all — save
as `.xlsx`/`.pptx` first. Chat-with-PDF deliberately uses a small **extractive**
QA model rather than a generative chat model: tiny generative models
(Qwen2.5-0.5B, SmolLM2-360M) tested here produced incoherent, repetitive
output regardless of decoding settings — a known failure mode for
sub-1B-parameter autoregressive models on CPU. Extractive QA is deterministic
and reliable at this size, but it can only answer questions whose answer is a
literal short span in the text — it won't summarize, compare, or reason
across multiple parts of the document (that's what Summarize PDF is for), and
it explicitly declines questions that don't share any real keyword with the
document rather than guessing.

## Local development

```bash
npm install
cp .env.example .env     # defaults are fine for local dev
npm run dev
```

The server listens on `http://localhost:4000` by default. The first call to
any AI route downloads its model from Hugging Face into `.model-cache/` (a few
hundred MB each) — expect that first request to be slow; after that the model
stays loaded in memory for the life of the process.

Point the frontend at this backend via `NEXT_PUBLIC_BACKEND_URL` in
`frontend/.env.local` (defaults to `http://localhost:4000` already).

## Deploying to shared/cPanel hosting

This backend was written specifically to avoid needing root, SSH, or Docker:

1. Upload this `backend/` folder to your hosting account.
2. In cPanel → **Setup Node.js App**, create an app pointing at this folder,
   with `server.js` as the entry point and a Node version ≥ 18.
3. Set environment variables in that same screen: `PORT` (cPanel usually
   assigns/manages this for you via its proxy), `ALLOWED_ORIGINS` (your
   frontend's real domain, comma-separated if more than one).
4. Click **Run NPM Install** in the cPanel UI (this is the equivalent of
   `npm install` and will also run the native postinstall steps for
   `onnxruntime-node`/`sharp` — if the app manager blocks postinstall scripts,
   you may need to run `npm install-scripts approve onnxruntime-node sharp
   protobufjs` once via whatever terminal access the panel gives you, or ask
   support to allow it).
5. Start/restart the app from the panel.

### Resource reality check

- **Disk:** model weights are downloaded once and cached in `.model-cache/`.
  Budget ~1.5GB total for all three AI models combined.
- **RAM/CPU:** these are small models (0.5B–600M params) chosen specifically
  to be runnable on CPU without a GPU, but shared hosting plans often cap RAM
  at a few hundred MB to ~1GB and throttle CPU. If a request times out or the
  app gets killed/restarted by the host under load, that's this limit, not a
  bug — the fix is either a bigger plan/VPS, or dropping to a smaller model
  (e.g. swap `nllb-200-distilled-600M` for a smaller per-language `opus-mt`
  model in `src/lib/localAi.js`).
- First request after a cold start/restart re-downloads nothing (models are
  cached on disk) but still has to load the model into memory, so the very
  first AI call after a restart will be slower than the rest.

## Security notes

- `src/lib/urlSafety.js` blocks the webpage-to-PDF endpoint from being used to
  probe your own internal network or cloud metadata endpoints (basic SSRF
  guard). It is not exhaustive (e.g. it doesn't protect against DNS rebinding
  between the check and the fetch).
- `ALLOWED_ORIGINS` controls CORS — set it to your actual frontend domain(s)
  in production rather than leaving it open.
