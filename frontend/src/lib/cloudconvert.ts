import "server-only";

const API_BASE = "https://api.cloudconvert.com/v2";

function apiKey(): string {
  const key = process.env.CLOUDCONVERT_API_KEY;
  if (!key) throw new Error("CLOUDCONVERT_API_KEY is not set on the server.");
  return key;
}

interface CcTask {
  id: string;
  name?: string;
  operation: string;
  status: "waiting" | "processing" | "finished" | "error";
  message?: string;
  result?: {
    form?: { url: string; parameters: Record<string, string> };
    files?: Array<{ filename: string; url?: string }>;
  };
}

interface CcJob {
  id: string;
  status: "waiting" | "processing" | "finished" | "error";
  tasks: CcTask[];
}

async function cc<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CloudConvert API error (${res.status}): ${body.slice(0, 500)}`);
  }
  return res.json() as Promise<T>;
}

async function pollJob(jobId: string, timeoutMs = 90_000, intervalMs = 1500): Promise<CcJob> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const res = await cc<{ data: CcJob }>(`/jobs/${jobId}`);
    if (res.data.status === "finished" || res.data.status === "error") return res.data;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Conversion timed out.");
}

async function downloadExport(job: CcJob): Promise<{ filename: string; bytes: Buffer }> {
  const exportTask = job.tasks.find((t) => t.operation === "export/url");
  const file = exportTask?.result?.files?.[0];
  if (job.status === "error" || exportTask?.status === "error" || !file?.url) {
    const failing = job.tasks.find((t) => t.status === "error");
    throw new Error(failing?.message ?? "CloudConvert couldn't complete this conversion.");
  }
  const res = await fetch(file.url);
  if (!res.ok) throw new Error(`Couldn't download the converted file (${res.status}).`);
  const bytes = Buffer.from(await res.arrayBuffer());
  return { filename: file.filename, bytes };
}

export async function convertFileViaCloudConvert(
  fileBytes: Buffer,
  filename: string,
  inputFormat: string,
  outputFormat: string,
): Promise<{ filename: string; bytes: Buffer }> {
  const created = await cc<{ data: CcJob }>("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tasks: {
        "upload-file": { operation: "import/upload" },
        "convert-file": {
          operation: "convert",
          input: "upload-file",
          input_format: inputFormat,
          output_format: outputFormat,
        },
        "export-file": { operation: "export/url", input: "convert-file" },
      },
    }),
  });

  const job = created.data;
  const uploadTask = job.tasks.find((t) => t.operation === "import/upload");
  const form = uploadTask?.result?.form;
  if (!form) throw new Error("CloudConvert didn't return an upload target.");

  const uploadBody = new FormData();
  for (const [key, value] of Object.entries(form.parameters)) {
    uploadBody.append(key, value);
  }
  uploadBody.append("file", new Blob([new Uint8Array(fileBytes)]), filename);

  const uploadRes = await fetch(form.url, { method: "POST", body: uploadBody });
  if (!uploadRes.ok) {
    throw new Error(`Upload to CloudConvert failed (${uploadRes.status}).`);
  }

  const finished = await pollJob(job.id);
  return downloadExport(finished);
}

export async function convertUrlToPdfViaCloudConvert(
  sourceUrl: string,
): Promise<{ filename: string; bytes: Buffer }> {
  const created = await cc<{ data: CcJob }>("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tasks: {
        "import-page": { operation: "import/url", url: sourceUrl },
        "convert-page": {
          operation: "convert",
          input: "import-page",
          input_format: "html",
          output_format: "pdf",
        },
        "export-page": { operation: "export/url", input: "convert-page" },
      },
    }),
  });

  const finished = await pollJob(created.data.id);
  return downloadExport(finished);
}
