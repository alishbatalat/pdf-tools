import type { Metadata } from "next";
import { RotateCw } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import RotatePdfTool from "@/components/tools/RotatePdfTool";

export const metadata: Metadata = {
  title: "Rotate PDF — Foldero",
  description: "Fix sideways or upside-down pages in bulk. Runs entirely in your browser.",
};

export default function RotatePdfPage() {
  return (
    <ToolPageShell
      icon={RotateCw}
      title="Rotate PDF"
      description="Fix sideways or upside-down pages in bulk."
      category="organize"
    >
      <RotatePdfTool />
    </ToolPageShell>
  );
}
