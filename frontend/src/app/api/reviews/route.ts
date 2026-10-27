import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteReview, getAllReviews, getReviewStats, upsertReview } from "@/lib/reviews-db";

export async function GET() {
  return NextResponse.json({ reviews: getAllReviews(), stats: getReviewStats() });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
  }

  const { target, targetLabel, rating, comment } = await req.json();
  if (typeof target !== "string" || typeof targetLabel !== "string") {
    return NextResponse.json({ error: "Missing target or targetLabel." }, { status: 400 });
  }
  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return NextResponse.json({ error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
  }

  const userName = session.user.name ?? session.user.email.split("@")[0];
  const trimmedComment = typeof comment === "string" ? comment.trim().slice(0, 1000) : null;

  upsertReview(session.user.email, userName, target, targetLabel, parsedRating, trimmedComment || null);
  return NextResponse.json({ reviews: getAllReviews(), stats: getReviewStats() });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { target } = await req.json();
  if (typeof target !== "string") {
    return NextResponse.json({ error: "Missing target." }, { status: 400 });
  }

  deleteReview(session.user.email, target);
  return NextResponse.json({ reviews: getAllReviews(), stats: getReviewStats() });
}
