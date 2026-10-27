"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Star, Trash2 } from "lucide-react";
import type { ReviewEntry } from "@/lib/reviews-db";
import { tools } from "@/lib/tools";

const SITE_TARGET = "site";
const SITE_LABEL = "Foldero (the website)";

const TARGET_OPTIONS = [
  { value: SITE_TARGET, label: SITE_LABEL },
  ...tools.map((t) => ({ value: t.href, label: t.title })),
];

function targetLabelFor(target: string) {
  return TARGET_OPTIONS.find((o) => o.value === target)?.label ?? target;
}

function formatWhen(iso: string) {
  const date = new Date(iso.replace(" ", "T") + "Z");
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="text-amber-400"
        >
          <Star size={28} fill={(hover || value) >= n ? "currentColor" : "none"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={rating >= n ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

export default function ReviewsBoard({
  initialReviews,
  initialStats,
}: {
  initialReviews: ReviewEntry[];
  initialStats: { count: number; average: number };
}) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const searchParams = useSearchParams();
  const requestedTarget = searchParams.get("target");
  const validTarget = requestedTarget && TARGET_OPTIONS.some((o) => o.value === requestedTarget) ? requestedTarget : undefined;
  const [reviews, setReviews] = useState(initialReviews);
  const [stats, setStats] = useState(initialStats);
  const [target, setTarget] = useState(validTarget ?? SITE_TARGET);
  const [filter, setFilter] = useState<string>(validTarget ?? "all");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    if (prefilled.current || !userEmail) return;
    async function run() {
      prefilled.current = true;
      const existing = reviews.find((r) => r.user_email === userEmail && r.target === target);
      if (existing) {
        setRating(existing.rating);
        setComment(existing.comment ?? "");
      }
    }
    void run();
  }, [userEmail, reviews, target]);

  const myReview = useMemo(
    () => (userEmail ? reviews.find((r) => r.user_email === userEmail && r.target === target) : undefined),
    [reviews, userEmail, target],
  );

  function selectTarget(next: string) {
    setTarget(next);
    const existing = userEmail ? reviews.find((r) => r.user_email === userEmail && r.target === next) : undefined;
    setRating(existing?.rating ?? 0);
    setComment(existing?.comment ?? "");
  }

  const filteredReviews = filter === "all" ? reviews : reviews.filter((r) => r.target === filter);
  const filteredAverage = filter === "all"
    ? stats.average
    : filteredReviews.reduce((sum, r) => sum + r.rating, 0) / (filteredReviews.length || 1);

  async function submitReview() {
    if (rating < 1) {
      setError("Pick a star rating before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, targetLabel: targetLabelFor(target), rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't submit your review.");
        return;
      }
      setReviews(data.reviews);
      setStats(data.stats);
    } catch {
      setError("Couldn't submit your review. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeMyReview() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't delete your review.");
        return;
      }
      setReviews(data.reviews);
      setStats(data.stats);
      setRating(0);
      setComment("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reviews &amp; ratings</h1>
        <p className="mt-1.5 text-sm text-muted sm:text-base">
          Rate Foldero overall, or a specific tool, and see what others think.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
        <span className="text-3xl font-bold text-foreground">{stats.average.toFixed(1)}</span>
        <div>
          <StarDisplay rating={Math.round(stats.average)} size={18} />
          <p className="mt-1 text-xs text-muted">
            {stats.count} review{stats.count === 1 ? "" : "s"} across the whole site
          </p>
        </div>
      </div>

      {session?.user ? (
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold text-foreground">Write a review</p>
          <label className="block text-xs font-medium text-muted">
            What are you rating?
            <select
              value={target}
              onChange={(e) => selectTarget(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              {TARGET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <StarPicker value={rating} onChange={setRating} />

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional — what worked well, or what didn't?"
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          />

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-foreground">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={submitReview}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {myReview ? "Update review" : "Submit review"}
            </button>
            {myReview && (
              <button
                type="button"
                disabled={submitting}
                onClick={removeMyReview}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-muted hover:text-accent disabled:opacity-40"
              >
                <Trash2 size={14} />
                Delete my review
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          <Link href="/auth/signin" className="font-semibold text-primary">
            Sign in
          </Link>{" "}
          to leave a review.
        </div>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            {filteredReviews.length} review{filteredReviews.length === 1 ? "" : "s"}
            {filter !== "all" && ` · average ${filteredAverage.toFixed(1)}`}
          </p>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground"
          >
            <option value="all">All reviews</option>
            {TARGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {filteredReviews.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
            No reviews yet &mdash; be the first to share what you think.
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredReviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                      {r.user_name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.user_name}</p>
                      <p className="text-xs text-muted">
                        {r.target_label} &middot; {formatWhen(r.created_at)}
                      </p>
                    </div>
                  </div>
                  <StarDisplay rating={r.rating} />
                </div>
                {r.comment && <p className="mt-2 text-sm text-foreground">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
