import { toolGuidance } from "@/lib/tool-guidance";
import { toolFaq, toolSteps } from "@/lib/tool-faq";
import Link from "next/link";
import { ArrowLeft, Infinity, ShieldCheck, type LucideIcon } from "lucide-react";
import { categoryMeta, tools, toolsByCategory, type ToolCategory } from "@/lib/tools";
import FavoriteButton from "./FavoriteButton";

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
  const steps = toolSteps(title, guidance.note);
  const faq = toolFaq(title, guidance.formats, guidance.browser);
  const href = tools.find((t) => t.title === title)?.href ?? `/tools/${category}`;

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
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <FavoriteButton href={href} size={20} className="tool-page-favorite" />
          </div>
          <p className="mt-1.5 text-sm text-muted sm:text-base">
            {description}
          </p>
        </div>
      </div>

      <div className="trust-badges">
        <span className="trust-badge"><Infinity size={13} />No limits, 100% free</span>
        <span className="trust-badge"><ShieldCheck size={13} />Secure tool</span>
      </div>

      <aside className="tool-guidance" aria-label="Before you begin"><div><span>{guidance.processing}</span><span>{guidance.formats}</span></div><p>{guidance.note}</p>{!guidance.browser && <p>Your file or extracted text is sent to the configured document server. <Link href="/privacy">Processing details</Link></p>}</aside>
      <div className="tool-body">{children}</div>

      <div className="tool-howto">
        <h2>How to use {title}</h2>
        <ol>
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="tool-faq">
        <h2>Common questions</h2>
        <div className="faq-list">
          {faq.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <div className="related-tools">
          <h2 className="text-sm font-semibold text-muted">
            More in {meta.label}
          </h2>
          <div className="related-tools-grid">
            {related.map((tool) => (
              <Link key={tool.href} href={tool.href} className="related-tool-card">
                <tool.icon size={17} strokeWidth={2.1} />
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



