import { toolGuidance } from "@/lib/tool-guidance";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { categoryMeta, toolsByCategory, type ToolCategory } from "@/lib/tools";

export default function ToolPageShell({
  icon: Icon,
  title,
  description,
  category,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  category: ToolCategory;
  children: React.ReactNode;
}) {
  const guidance = toolGuidance(title, category);
  const meta = categoryMeta[category];
  const related = toolsByCategory(category).filter((t) => t.title !== title);

  return (
    <div className="tool-workspace mx-auto max-w-4xl px-6 py-8">
      <Link
        href={`/tools?category=${category}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted  hover:text-foreground"
      >
        <ArrowLeft size={14} />
        All tools
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">

          <Icon size={22} strokeWidth={2.1} />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted sm:text-base">
            {description}
          </p>
        </div>
      </div>

      <aside className="tool-guidance" aria-label="Before you begin"><div><span>{guidance.processing}</span><span>{guidance.formats}</span></div><p>{guidance.note}</p>{!guidance.browser && <p>Your file or extracted text is sent to the configured document server. <Link href="/privacy">Processing details</Link></p>}</aside>
      <div className="tool-body">{children}</div>

      {related.length > 0 && (
        <div className="related-tools">
          <h2 className="text-sm font-semibold text-muted">
            More in {meta.label}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground  hover:border-primary/40 hover:text-primary"
              >
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



