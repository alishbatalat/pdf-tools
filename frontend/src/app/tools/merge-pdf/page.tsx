import type { Metadata } from "next";
import { FileStack } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import MergePdfTool from "@/components/tools/MergePdfTool";

export const metadata: Metadata = {
  title: "Merge PDF — Foldero",
  description: "Combine multiple PDFs into one, in the order you want. Runs entirely in your browser.",
};

export default function MergePdfPage() {
  return (
    <ToolPageShell
      icon={FileStack}
      title="Merge PDF"
      description="Combine multiple PDFs into one, in the order you want."
      category="organize"
    >
      <MergePdfTool />
    </ToolPageShell>
  );
}
