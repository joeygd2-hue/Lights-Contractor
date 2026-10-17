import "server-only";
import { createHash, randomInt } from "node:crypto";

/** Client IP from the platform's forwarding headers (Vercel, most proxies). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** We never store raw IPs — only a salted hash for rate limiting/abuse review. */
export function hashIp(ip: string): string {
  const salt = process.env.SESSION_SECRET ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

// No 0/O/1/I/L to keep references easy to read over the phone.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Human-friendly reference, e.g. "Q-7K3Q9M". */
export function makeReference(prefix: "Q" | "C" | "B"): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${out}`;
}

/** Minimum time a human plausibly needs before submitting a form. */
export function submittedTooFast(startedAt: number, minMs: number): boolean {
  return Date.now() - startedAt < minMs;
}

/** Postgres error code helper (pg puts it on `.code`, drizzle wraps in `.cause`). */
export function pgCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}

export function pgConstraint(err: unknown): string | undefined {
  const e = err as { constraint?: string; cause?: { constraint?: string } };
  return e?.constraint ?? e?.cause?.constraint;
}
