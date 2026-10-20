import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/users-db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { name, email, password } = await req.json().catch(() => ({}));

  if (typeof name !== "string" || name.trim().length < 1) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  createUser(email, name, password);
  return NextResponse.json({ ok: true });
}
