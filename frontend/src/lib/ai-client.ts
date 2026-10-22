import { BACKEND_URL } from "./backend-url";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Couldn't reach the document server. It may be starting up or isn't running — try again in a moment.",
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
  return data as T;
}

export function summarizeText(text: string) {
  return postJson<{ summary: string; truncated: boolean }>("/api/summarize", { text });
}

export function translateText(text: string, targetLanguage: string) {
  return postJson<{ translation: string; truncated: boolean }>("/api/translate", {
    text,
    targetLanguage,
  });
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export function askAboutDocument(documentText: string, history: ChatTurn[]) {
  return postJson<{ answer: string }>("/api/chat-pdf", { documentText, history });
}
