import type { Metadata } from "next";
import { Hash } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import PageNumbersTool from "@/components/tools/PageNumbersTool";

export const metadata: Metadata = {
  title: "Add Page Numbers — Foldero",
  description: "Number every page of a PDF. Runs entirely in your browser.",
};

export default function PageNumbersPage() {
  return (
    <ToolPageShell
      icon={Hash}
      title="Add Page Numbers"
      description="Number every page of a PDF, bottom-centered."
      category="organize"
    >
      <PageNumbersTool />
    </ToolPageShell>
  );
}
