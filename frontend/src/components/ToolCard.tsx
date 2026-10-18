import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { type Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return <Link href={tool.href} className={`tool-card tool-category-${tool.category}`}><div className="tool-card-top"><span className="tool-icon"><Icon size={22} strokeWidth={1.7} /></span><ArrowUpRight className="tool-arrow" size={18} /></div><h3>{tool.title}</h3><p>{tool.description}</p></Link>;
}
