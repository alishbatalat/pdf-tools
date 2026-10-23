import type { Metadata } from "next";
import { FileSignature } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import SignPdfTool from "@/components/tools/SignPdfTool";

export const metadata: Metadata = {
  title: "Sign PDF — Foldero",
  description: "Draw, upload, or photograph a signature and place it on your PDF. Runs entirely in your browser.",
};

export default function SignPdfPage() {
  return (
    <ToolPageShell
      icon={FileSignature}
      title="Sign PDF"
      description="Add a signature, text, or image anywhere on your document, then save."
      category="organize"
    >
      <SignPdfTool />
    </ToolPageShell>
  );
}
