import path from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline } from "@huggingface/transformers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keep downloaded model weights inside the backend folder (writable on shared hosting)
// instead of the default OS cache dir, which may not be writable/persistent there.
env.cacheDir = path.join(__dirname, "..", "..", ".model-cache");

const MAX_INPUT_CHARS = 60_000;

const NLLB_LANG_CODES = {
  Spanish: "spa_Latn",
  French: "fra_Latn",
  German: "deu_Latn",
  Portuguese: "por_Latn",
  Italian: "ita_Latn",
  Japanese: "jpn_Jpan",
  Korean: "kor_Hang",
  "Chinese (Simplified)": "zho_Hans",
  Arabic: "arb_Arab",
  Hindi: "hin_Deva",
  Urdu: "urd_Arab",
  Russian: "rus_Cyrl",
};

export function clampText(text, max = MAX_INPUT_CHARS) {
  if (text.length <= max) return { text, truncated: false };
  return { text: text.slice(0, max), truncated: true };
}

// Lazily create each pipeline once and keep it in memory across requests —
// this process stays alive (it's a persistent Node app, not serverless), so
// paying the model-load cost once per process is the right trade-off.
const pipelines = {};
function getPipeline(key, task, model, options) {
  if (!pipelines[key]) {
    pipelines[key] = pipeline(task, model, options);
  }
  return pipelines[key];
}

function getSummarizer() {
  return getPipeline("summarizer", "summarization", "Xenova/distilbart-cnn-6-6", {
    dtype: "q8",
  });
}

function getTranslator() {
  return getPipeline("translator", "translation", "Xenova/nllb-200-distilled-600M", {
    dtype: "q8",
  });
}

function getChatModel() {
  // Extractive QA, not a generative chat model: small quantized generative
  // models (tested: Qwen2.5-0.5B-Instruct, SmolLM2-360M-Instruct) produced
  // incoherent, repetitive output regardless of decoding settings — a known
  // failure mode for tiny autoregressive models on CPU. Span-extraction QA
  // is deterministic and reliable at this size, at the cost of only being
  // able to answer questions whose answer is a literal span in the text.
  return getPipeline("chat", "question-answering", "Xenova/distilbert-base-cased-distilled-squad");
}

const MIN_CONFIDENT_SCORE = 0.05;

// The QA model's own confidence score is not a reliable "is this even in the
// document" signal — it happily returns high-confidence wrong answers for
// off-topic questions (e.g. asking about Japan over a document about the
// Eiffel Tower still scored 0.55 on "Paris, France"). Stopword-filtered
// keyword overlap between the question and the document is the real gate.
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "of", "to", "in", "on", "at", "for", "and", "or", "but", "if", "as",
  "by", "with", "about", "into", "than", "then", "so", "this", "that",
  "these", "those", "it", "its", "what", "who", "whom", "when", "where",
  "why", "how", "which", "do", "does", "did", "will", "would", "can",
  "could", "should", "shall", "may", "might", "must", "has", "have",
  "had", "not", "you", "your", "there", "here", "also", "from", "any",
]);

function keywordsOf(str) {
  const words = str.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  return words.filter((w) => !STOPWORDS.has(w));
}

function splitIntoChunks(text, maxChars) {
  const paragraphs = text.split(/\n{2,}/);
  const chunks = [];
  let current = "";
  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChars && current) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) chunks.push(current);
  // A single huge paragraph with no breaks — hard-split it.
  return chunks.flatMap((chunk) =>
    chunk.length > maxChars
      ? chunk.match(new RegExp(`.{1,${maxChars}}`, "gs")) ?? [chunk]
      : [chunk],
  );
}

export async function summarizeTextLocal(rawText) {
  const { text, truncated } = clampText(rawText);
  const summarizer = await getSummarizer();

  // distilbart's encoder window is ~1024 tokens (~4000 chars); chunk and
  // summarize each piece, then do one more pass over the combined summaries
  // for documents long enough to need it (map-reduce summarization).
  const chunks = splitIntoChunks(text, 3500);
  const chunkSummaries = [];
  for (const chunk of chunks) {
    const out = await summarizer(chunk, { max_new_tokens: 180, min_new_tokens: 30 });
    chunkSummaries.push(out[0].summary_text.trim());
  }

  let summary = chunkSummaries.join("\n\n");
  if (chunkSummaries.length > 1) {
    const combined = chunkSummaries.join(" ");
    const final = await summarizer(combined.slice(0, 3500), {
      max_new_tokens: 220,
      min_new_tokens: 40,
    });
    summary = final[0].summary_text.trim();
  }

  return { summary, truncated };
}

export async function translateTextLocal(rawText, targetLanguage) {
  const tgtCode = NLLB_LANG_CODES[targetLanguage];
  if (!tgtCode) {
    throw new Error(`Unsupported target language: ${targetLanguage}`);
  }
  const { text, truncated } = clampText(rawText);
  const translator = await getTranslator();

  const chunks = splitIntoChunks(text, 1800);
  const translated = [];
  for (const chunk of chunks) {
    const out = await translator(chunk, {
      src_lang: "eng_Latn",
      tgt_lang: tgtCode,
    });
    translated.push(out[0].translation_text.trim());
  }

  return { translation: translated.join("\n\n"), truncated };
}

export async function chatAboutDocumentLocal(documentText, history) {
  const { text } = clampText(documentText, 20_000);
  const question = history[history.length - 1]?.text ?? "";

  // No embeddings model on board — pick candidate chunks with plain keyword
  // overlap (cheap, good enough for grounding), then run the QA reader over
  // each candidate and keep its highest-confidence answer. distilbert's
  // window is ~512 tokens, so chunks stay small.
  const chunks = splitIntoChunks(text, 800);
  const questionWords = new Set(keywordsOf(question));
  const ranked = chunks
    .map((chunk) => {
      const words = keywordsOf(chunk);
      const overlap = words.reduce((acc, w) => acc + (questionWords.has(w) ? 1 : 0), 0);
      return { chunk, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap);

  // If the question shares no meaningful (non-stopword) keyword with any
  // part of the document, it's almost certainly not covered by it — don't
  // even bother asking the model, since it will confidently hallucinate an
  // answer anyway.
  if (questionWords.size > 0 && ranked[0]?.overlap === 0) {
    return { answer: "I couldn't find an answer to that in this document." };
  }

  const candidates = ranked.slice(0, 5).map((r) => r.chunk);
  const qa = await getChatModel();
  let best = null;
  for (const chunk of candidates) {
    const result = await qa(question, chunk);
    if (!best || result.score > best.score) best = result;
  }

  if (!best || best.score < MIN_CONFIDENT_SCORE) {
    return { answer: "I couldn't find an answer to that in this document." };
  }
  return { answer: best.answer };
}

export const supportedTranslationLanguages = Object.keys(NLLB_LANG_CODES);
