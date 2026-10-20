export function logActivity(toolSlug: string, toolTitle: string, fileName: string) {
  // Fire-and-forget: a signed-out visitor gets {skipped:true}, and any network
  // failure here must never surface to the user — it's just history, not the task.
  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolSlug, toolTitle, fileName }),
  }).catch(() => {});
}
