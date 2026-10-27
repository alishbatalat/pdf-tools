import { toolGuidance } from "@/lib/tool-guidance";
import { toolSteps } from "@/lib/tool-faq";
import Link from "next/link";
import { ArrowLeft, Infinity, ShieldCheck, Star, type LucideIcon } from "lucide-react";
import { categoryMeta, tools, toolsByCategory, type ToolCategory } from "@/lib/tools";
import { getStatsForTarget } from "@/lib/reviews-db";
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
  const href = tools.find((t) => t.title === title)?.href ?? `/tools/${category}`;
  const ratingStats = getStatsForTarget(href);

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
        <span className={`tool-heading-icon tool-category-${category}`} aria-hidden="true">

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

      <div className="mt-4 flex justify-center">
        <Link
          href={`/reviews?target=${encodeURIComponent(href)}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <Star size={15} className="text-amber-400" fill={ratingStats.count > 0 ? "currentColor" : "none"} />
          {ratingStats.count > 0 ? (
            <>
              <strong className="font-semibold text-foreground">{ratingStats.average.toFixed(1)}</strong>
              <span>({ratingStats.count} {ratingStats.count === 1 ? "vote" : "votes"})</span>
            </>
          ) : (
            <span>Not yet rated &mdash; be the first to review</span>
          )}
        </Link>
      </div>

      <div className="tool-howto">
        <h2>How to use {title}</h2>
        <ol>
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
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



