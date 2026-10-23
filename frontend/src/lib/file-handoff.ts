"use client";

// A one-shot, in-memory handoff slot for carrying a just-produced file from
// one tool's result screen into another tool's dropzone. Client-side route
// changes in the App Router don't reload the page, so a plain module-level
// variable survives the navigation — no storage/serialization needed, and it
// naturally clears itself (and on refresh) since nothing ever persists it.
let pending: File | null = null;

export function setHandoffFile(file: File) {
  pending = file;
}

export function takeHandoffFile(): File | null {
  const file = pending;
  pending = null;
  return file;
}
