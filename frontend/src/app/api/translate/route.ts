import { NextResponse } from "next/server";
import { clampText, generateText } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "No document text was provided." }, { status: 400 });
    }
    if (typeof targetLanguage !== "string" || !targetLanguage.trim()) {
      return NextResponse.json({ error: "No target language was provided." }, { status: 400 });
    }

    const { text: clamped, truncated } = clampText(text);
    const prompt = `Translate the following document into ${targetLanguage}. Preserve paragraph breaks and overall structure. Output only the translation, no notes or commentary.\n\n${truncated ? "(Document truncated to fit — translating the first portion.)\n\n" : ""}---\n${clamped}\n---`;

    const translation = await generateText([{ role: "user", text: prompt }]);
    return NextResponse.json({ translation, truncated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't translate this document.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
