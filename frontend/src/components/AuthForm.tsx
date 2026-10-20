"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import GoogleIcon from "./GoogleIcon";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email already has a password-based account here. Sign in with your email and password instead, or use a different Google account.",
  AccessDenied: "That sign-in was cancelled or denied.",
  Configuration: "Sign-in isn't set up correctly on this site yet.",
  CredentialsSignin: "Incorrect email or password.",
  Verification: "That sign-in link is no longer valid.",
};

function readableAuthError(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? "Something went wrong signing in. Please try again.";
}

const SHOW_GOOGLE_SIGNIN = true;

export default function AuthForm({ googleConfigured }: { googleConfigured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const code = searchParams.get("error");
    if (code) setError(readableAuthError(code));
  }, [searchParams]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    setWorking(false);
    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create your account.");
        setWorking(false);
        return;
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      setWorking(false);
      if (result?.error) {
        setError("Account created — sign in with your new password.");
        setMode("signin");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Couldn't create your account. Try again.");
      setWorking(false);
    }
  }

  return (
    <div className="auth-form">
      <h1>{mode === "signin" ? "Sign in" : "Create your account"}</h1>
      <p className="support-intro">
        {mode === "signin"
          ? "See which tools you've used and which files you've worked with."
          : "Takes a few seconds — just an email and a password."}
      </p>

      {SHOW_GOOGLE_SIGNIN && googleConfigured && (
        <>
          <button
            type="button"
            className="sign-in-button auth-google-button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <GoogleIcon size={18} />
            Continue with Google
          </button>
          <div className="auth-divider">
            <span>or</span>
          </div>
        </>
      )}

      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="auth-fields">
        {mode === "signup" && (
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
          {mode === "signup" && <small>At least 8 characters.</small>}
        </label>

        {error && (
          <p className="upload-error" role="alert">
            <AlertCircle size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: "6px" }} />
            {error}
          </p>
        )}

        <button type="submit" className="primary-button auth-submit" disabled={working}>
          {working ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="auth-toggle">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button type="button" onClick={() => { setMode("signup"); setError(null); }}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => { setMode("signin"); setError(null); }}>
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
