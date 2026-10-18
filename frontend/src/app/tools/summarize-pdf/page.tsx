import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import SummarizePdfTool from "@/components/tools/SummarizePdfTool";

export const metadata: Metadata = {
  title: "Summarize PDF — Foldero",
  description: "Get a concise AI summary of a long document.",
};

export default function SummarizePdfPage() {
  return (
    <ToolPageShell
      icon={Sparkles}
      title="Summarize PDF"
      description="Get a concise AI summary of a long document."
      category="ai"
    >
      <SummarizePdfTool />
    </ToolPageShell>
  );
}
