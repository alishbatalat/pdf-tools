import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActivity, recordActivity } from "@/lib/activity-db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  return NextResponse.json({ activity: getActivity(session.user.email) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    // Signed-out users can still use every tool; there's just no history to save.
    return NextResponse.json({ skipped: true });
  }

  const { toolSlug, toolTitle, fileName } = await req.json();
  if (typeof toolSlug !== "string" || typeof toolTitle !== "string") {
    return NextResponse.json({ error: "Missing toolSlug or toolTitle." }, { status: 400 });
  }

  recordActivity(session.user.email, toolSlug, toolTitle, typeof fileName === "string" ? fileName : null);
  return NextResponse.json({ ok: true });
}
