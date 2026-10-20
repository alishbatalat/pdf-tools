import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { type Tool } from "@/lib/tools";
import { toolGuidance } from "@/lib/tool-guidance";
export default function ToolCard({tool}:{tool:Tool}) {
  const Icon = tool.icon;
  const guidance = toolGuidance(tool.title,tool.category);
  return <Link href={tool.href} className={`tool-card tool-category-${tool.category}`}><div className="tool-card-top"><span className="tool-icon"><Icon size={24} strokeWidth={1.8} aria-hidden="true" /></span><ArrowUpRight className="tool-arrow" size={17} aria-hidden="true" /></div><h3>{tool.title}</h3><p>{tool.description}</p><span className="tool-processing-label">{guidance.browser ? "In your browser" : "Document server"}</span></Link>;
}
