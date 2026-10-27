import { Suspense } from "react";
import type { Metadata } from "next";
import ReviewsBoard from "@/components/ReviewsBoard";
import { getAllReviews, getReviewStats } from "@/lib/reviews-db";

export const metadata: Metadata = {
  title: "Reviews & ratings — Foldero",
  description: "See what people think of Foldero and its tools, and leave your own rating.",
};

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted">Loading reviews…</div>}>
      <ReviewsBoard initialReviews={getAllReviews()} initialStats={getReviewStats()} />
    </Suspense>
  );
}
