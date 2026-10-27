import type { Metadata } from "next";
import { Image as ImageIcon } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import PdfToPngTool from "@/components/tools/PdfToPngTool";

export const metadata: Metadata = {
  title: "PDF to PNG — Foldero",
  description: "Turn each PDF page into a separate PNG image in lossless quality, with the resolution you choose. Runs entirely in your browser.",
};

export default function PdfToPngPage() {
  return (
    <ToolPageShell
      icon={ImageIcon}
      title="PDF to PNG"
      description="Turn each PDF page into a separate PNG image in lossless quality, with the resolution you choose."
      category="from-pdf"
    >
      <PdfToPngTool />
    </ToolPageShell>
  );
}
