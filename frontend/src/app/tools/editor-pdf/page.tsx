import type { Metadata } from "next";
import { PenSquare } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import EditorPdfTool from "@/components/tools/EditorPdfTool";

export const metadata: Metadata = {
  title: "Editor PDF — Foldero",
  description: "Add text, images, and shapes anywhere on a PDF page. Runs entirely in your browser.",
};

export default function EditorPdfPage() {
  return (
    <ToolPageShell
      icon={PenSquare}
      title="Editor PDF"
      description="Add text, images, and shapes anywhere on a page, then save your changes."
      category="organize"
    >
      <EditorPdfTool />
    </ToolPageShell>
  );
}
