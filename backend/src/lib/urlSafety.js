import dns from "node:dns/promises";
import net from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0"]);

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true; // RFC1918
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local / cloud metadata (169.254.169.254)
    if (a === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    if (lower.startsWith("fe80")) return true; // link-local
    return false;
  }
  return false;
}

/**
 * Basic SSRF guard for the webpage-to-PDF endpoint: rejects obvious
 * loopback/private/link-local/cloud-metadata targets before we let the
 * server fetch a user-supplied URL. Not bulletproof against DNS rebinding,
 * but blocks the common cases.
 */
export async function assertPublicHttpUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Enter a valid http(s) URL.");
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("Enter a valid http(s) URL.");
  }
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("That URL isn't allowed.");
  }
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("That URL isn't allowed.");
    return url;
  }
  const records = await dns.lookup(hostname, { all: true }).catch(() => []);
  if (records.length === 0 || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("That URL isn't allowed.");
  }
  return url;
}
