"use client";

import { ArrowRight } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div
        className="relative overflow-hidden rounded-3xl border border-border bg-primary-soft px-8 py-14 text-center sm:px-16"
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Pick a tool, drop a file, done.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted sm:text-base">
          No sign-up, no watermark, no catch. Foldero does the fold so you
          don&apos;t have to.
        </p>
        <a
          href="#tools"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30"
        >
          Get started free
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

