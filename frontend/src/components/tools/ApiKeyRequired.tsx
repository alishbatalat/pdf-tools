"use client";

import { KeyRound, Lock } from "lucide-react";

export default function ApiKeyRequired({
  service,
  envVar,
  note,
}: {
  service: string;
  envVar: string;
  note?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-5 py-4 text-sm">
        <KeyRound size={18} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <p className="font-semibold text-accent-foreground">
            This tool needs a {service} API key to run.
          </p>
          <p className="mt-1 text-muted">
            Add <code className="rounded bg-background px-1.5 py-0.5 text-xs">{envVar}</code> to
            your environment and wire it into this page&apos;s API route to turn it on.
            {note ? ` ${note}` : ""}
          </p>
        </div>
      </div>

      <div className="flex cursor-not-allowed flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface px-6 py-14 text-center opacity-50">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-muted">
          <Lock size={20} />
        </span>
        <p className="text-sm font-medium text-foreground">
          Upload will be enabled once {service} is connected
        </p>
      </div>
    </div>
  );
}
