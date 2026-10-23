import type { Metadata } from "next";
import { Ruler } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import ChangePageSizeTool from "@/components/tools/ChangePageSizeTool";

export const metadata: Metadata = {
  title: "Change Page Size — Foldero",
  description: "Resize every page in a PDF to A4, A3, Letter, Legal, or another standard size. Runs entirely in your browser.",
};

export default function ChangePageSizePage() {
  return (
    <ToolPageShell
      icon={Ruler}
      title="Change Page Size"
      description="Resize every page to A4, A3, Letter, and other standard sizes."
      category="organize"
    >
      <ChangePageSizeTool />
    </ToolPageShell>
  );
}
