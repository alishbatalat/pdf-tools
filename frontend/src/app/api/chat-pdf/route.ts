import { NextResponse } from "next/server";
import { clampText, generateText } from "@/lib/gemini";

export const maxDuration = 60;

interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export async function POST(req: Request) {
  try {
    const { documentText, history } = await req.json();
    if (typeof documentText !== "string" || !documentText.trim()) {
      return NextResponse.json({ error: "No document text was provided." }, { status: 400 });
    }
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: "No question was provided." }, { status: 400 });
    }

    const { text: clamped, truncated } = clampText(documentText);
    const grounding = `You answer questions about the document below. Only use information from the document; if the answer isn't in it, say so. Be concise.\n\n${truncated ? "(Document truncated to fit.)\n\n" : ""}---\n${clamped}\n---`;

    const turns: ChatTurn[] = history as ChatTurn[];
    const messages: ChatTurn[] = [
      { role: "user", text: grounding },
      { role: "model", text: "Understood. Ask me anything about this document." },
      ...turns,
    ];

    const answer = await generateText(messages);
    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't answer that question.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
