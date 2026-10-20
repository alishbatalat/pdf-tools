import { Suspense } from "react";
import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in — Foldero",
  description: "Sign in or create an account to save your activity.",
};

export default function SignInPage() {
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <main className="flex-1 support-page" style={{ maxWidth: "440px" }}>
      <Suspense fallback={null}>
        <AuthForm googleConfigured={googleConfigured} />
      </Suspense>
    </main>
  );
}
