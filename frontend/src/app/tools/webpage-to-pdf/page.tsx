import type { Metadata } from "next";
import { Globe } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import WebpageToPdfTool from "@/components/tools/WebpageToPdfTool";

export const metadata: Metadata = {
  title: "Webpage to PDF — Foldero",
  description: "Turn any URL into a saved, shareable PDF.",
};

export default function WebpageToPdfPage() {
  return (
    <ToolPageShell
      icon={Globe}
      title="Webpage to PDF"
      description="Turn any URL into a saved, shareable PDF."
      category="to-pdf"
    >
      <WebpageToPdfTool />
    </ToolPageShell>
  );
}
