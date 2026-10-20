import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { History } from "lucide-react";
import { auth } from "@/auth";
import { getActivity } from "@/lib/activity-db";

export const metadata: Metadata = {
  title: "My activity — Foldero",
  description: "Tools you've used and files you've worked with.",
};

function formatWhen(iso: string) {
  // SQLite's datetime('now') is UTC with no offset marker; tell JS explicitly.
  const date = new Date(iso.replace(" ", "T") + "Z");
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function HistoryContent() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <p className="support-intro">
        Sign in with Google from the top-right corner to see which tools you&apos;ve used
        and which files you&apos;ve worked with.
      </p>
    );
  }

  const activity = getActivity(session.user.email);

  return (
    <>
      <p className="support-intro">
        Signed in as {session.user.email}. This is a record of which tool you used and
        which file you worked with &mdash; not the file itself, which was deleted after
        processing like always.
      </p>

      {activity.length === 0 ? (
        <p className="support-intro" style={{ marginTop: "24px" }}>
          Nothing yet &mdash; use any tool while signed in and it&apos;ll show up here.
        </p>
      ) : (
        <ul className="faq-list" style={{ marginTop: "24px" }}>
          {activity.map((entry) => (
            <li key={entry.id} className="task-row" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="task-icon">
                <History size={18} />
              </span>
              <span>
                <strong>{entry.tool_title}</strong>
                <small>
                  {entry.file_name ? `${entry.file_name} · ` : ""}
                  {formatWhen(entry.created_at)}
                </small>
              </span>
              <Link href={`/tools/${entry.tool_slug}`}>Open</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function HistoryPage() {
  return (
    <main className="flex-1 support-page">
      <h1>My activity</h1>
      <Suspense fallback={<p className="support-intro">Loading&hellip;</p>}>
        <HistoryContent />
      </Suspense>
    </main>
  );
}
