import type { Metadata } from "next";
import { FileMinus } from "lucide-react";
import ToolPageShell from "@/components/ToolPageShell";
import DeletePagesTool from "@/components/tools/DeletePagesTool";

export const metadata: Metadata = {
  title: "Delete PDF Pages — Foldero",
  description: "Remove the pages you don't need from a document. Runs entirely in your browser.",
};

export default function DeletePagesPage() {
  return (
    <ToolPageShell
      icon={FileMinus}
      title="Delete Pages"
      description="Remove the pages you don't need from a document."
      category="organize"
    >
      <DeletePagesTool />
    </ToolPageShell>
  );
}
