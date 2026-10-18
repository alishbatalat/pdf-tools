import type { Metadata } from "next";
import { Image as ImageIcon } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import PdfToImageTool from "@/components/tools/PdfToImageTool";

export const metadata: Metadata = {
  title: "PDF to Image — Foldero",
  description: "Export PDF pages as JPG or PNG images. Runs entirely in your browser.",
};

export default function PdfToImagePage() {
  return (
    <ToolPageShell
      icon={ImageIcon}
      title="PDF to Image"
      description="Export pages as JPG or PNG images."
      category="from-pdf"
    >
      <PdfToImageTool />
    </ToolPageShell>
  );
}
