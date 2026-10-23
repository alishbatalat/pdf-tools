"use client";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SCOPE = "https://www.googleapis.com/auth/drive.file";

let gapiPromise: Promise<void> | null = null;
let gisPromise: Promise<void> | null = null;
let tokenClient: any = null;
let cachedToken: string | null = null;

export function isGoogleDriveConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY,
  );
}

export function acceptToDriveMimeTypes(accept: string): string[] {
  const types = accept
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes("/"));
  return types.length > 0 ? types : ["application/pdf"];
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Google's script. Check your connection and try again."));
    document.head.appendChild(script);
  });
}

function ensureGapiPicker(): Promise<void> {
  if (!gapiPromise) {
    gapiPromise = loadScript("https://apis.google.com/js/api.js").then(
      () =>
        new Promise<void>((resolve, reject) => {
          window.gapi.load("picker", { callback: resolve, onerror: reject });
        }),
    );
  }
  return gapiPromise;
}

function ensureGis(): Promise<void> {
  if (!gisPromise) {
    gisPromise = loadScript("https://accounts.google.com/gsi/client");
  }
  return gisPromise;
}

function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: () => {},
      });
    }
    tokenClient.callback = (resp: { access_token?: string; error?: string }) => {
      if (resp.error || !resp.access_token) {
        reject(new Error("Google Drive access wasn't granted."));
        return;
      }
      cachedToken = resp.access_token;
      resolve(resp.access_token);
    };
    tokenClient.requestAccessToken({ prompt: cachedToken ? "" : "consent" });
  });
}

interface DrivePicked {
  id: string;
  name: string;
  mimeType: string;
}

function showPicker(options: {
  apiKey: string;
  token: string;
  mimeTypes: string[];
  multiple: boolean;
}): Promise<DrivePicked[]> {
  return new Promise((resolve, reject) => {
    const google = window.google;
    try {
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setMimeTypes(options.mimeTypes.join(","))
        .setSelectFolderEnabled(false);

      const builder = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(options.token)
        .setDeveloperKey(options.apiKey)
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            resolve((data.docs ?? []).map((d: any) => ({ id: d.id, name: d.name, mimeType: d.mimeType })));
          } else if (data.action === google.picker.Action.CANCEL) {
            resolve([]);
          }
        });
      if (options.multiple) builder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED);
      builder.build().setVisible(true);
    } catch {
      reject(new Error("Couldn't open the Google Drive picker."));
    }
  });
}

const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";

async function resolveShortcut(file: DrivePicked, token: string): Promise<DrivePicked> {
  if (file.mimeType !== SHORTCUT_MIME) return file;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?fields=shortcutDetails&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return file;
  const body = await res.json();
  const targetId = body?.shortcutDetails?.targetId;
  const targetMimeType = body?.shortcutDetails?.targetMimeType;
  if (!targetId) return file;
  return { id: targetId, name: file.name, mimeType: targetMimeType ?? file.mimeType };
}

async function downloadDriveFile(picked: DrivePicked, token: string): Promise<File> {
  const file = await resolveShortcut(picked, token);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    let reason = "";
    try {
      const body = await res.json();
      reason = body?.error?.message ?? "";
    } catch {
      // response wasn't JSON — ignore and fall back to the status text
    }
    throw new Error(
      `Couldn't download "${file.name}" from Drive (${res.status}${reason ? `: ${reason}` : ` ${res.statusText}`}).`,
    );
  }
  const blob = await res.blob();
  return new File([blob], file.name, { type: file.mimeType || blob.type });
}

export async function pickFromGoogleDrive(options: {
  mimeTypes: string[];
  multiple?: boolean;
}): Promise<File[]> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY;
  if (!clientId || !apiKey) {
    throw new Error("Google Drive import isn't set up on this site yet.");
  }

  await Promise.all([ensureGapiPicker(), ensureGis()]);
  const token = await requestAccessToken(clientId);
  const picked = await showPicker({ apiKey, token, mimeTypes: options.mimeTypes, multiple: !!options.multiple });
  if (picked.length === 0) return [];
  return Promise.all(picked.map((p) => downloadDriveFile(p, token)));
}
