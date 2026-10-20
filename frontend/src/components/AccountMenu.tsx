"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { History, LogOut } from "lucide-react";

export default function AccountMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <span className="account-menu-skeleton" aria-hidden="true" />;
  }

  if (!session?.user) {
    return (
      <Link href="/auth/signin" className="sign-in-button">
        Sign in
      </Link>
    );
  }

  return (
    <div className="account-menu">
      <button
        type="button"
        className="account-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="account-avatar" referrerPolicy="no-referrer" />
        ) : (
          <span className="account-avatar-fallback">
            {(session.user.name ?? session.user.email ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      {open && (
        <div className="account-dropdown" onMouseLeave={() => setOpen(false)}>
          <div className="account-dropdown-info">
            <strong>{session.user.name}</strong>
            <span>{session.user.email}</span>
          </div>
          <Link href="/history" onClick={() => setOpen(false)}>
            <History size={15} />
            My activity
          </Link>
          <button type="button" onClick={() => signOut()}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
