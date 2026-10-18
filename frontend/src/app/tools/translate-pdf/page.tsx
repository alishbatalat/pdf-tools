import type { Metadata } from "next";
import { Languages } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import TranslatePdfTool from "@/components/tools/TranslatePdfTool";

export const metadata: Metadata = {
  title: "Translate PDF — Foldero",
  description: "Translate a PDF's content while keeping its layout.",
};

export default function TranslatePdfPage() {
  return (
    <ToolPageShell
      icon={Languages}
      title="Translate PDF"
      description="Translate a PDF's content while keeping its layout."
      category="ai"
    >
      <TranslatePdfTool />
    </ToolPageShell>
  );
}
