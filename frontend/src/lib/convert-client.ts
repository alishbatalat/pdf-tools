async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}

export async function convertFileRemote(file: File, outputFormat: string): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("outputFormat", outputFormat);

  const res = await fetch("/api/convert-file", { method: "POST", body: formData });
  if (!res.ok) throw new Error(await readError(res));
  return res.blob();
}

export async function convertWebpageRemote(url: string): Promise<Blob> {
  const res = await fetch("/api/convert-webpage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.blob();
}
