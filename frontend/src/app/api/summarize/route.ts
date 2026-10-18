import { NextResponse } from "next/server";
import { clampText, generateText } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "No document text was provided." }, { status: 400 });
    }

    const { text: clamped, truncated } = clampText(text);
    const prompt = `Summarize the following document in a clear, concise way. Use short paragraphs or bullet points as appropriate. Don't add commentary about the summarization itself — just give the summary.\n\n${truncated ? "(Document truncated to fit — summarizing the first portion.)\n\n" : ""}---\n${clamped}\n---`;

    const summary = await generateText([{ role: "user", text: prompt }]);
    return NextResponse.json({ summary, truncated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't summarize this document.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
