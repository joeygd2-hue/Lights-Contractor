import "server-only";
import type { z } from "zod";
import { fieldErrors } from "@/lib/validation";
import { clientIp, hashIp } from "./request";
import { rateLimit } from "./rate-limit";

/** Predictable JSON error shape for every public endpoint. */
export function jsonError(status: number, message: string, fields?: Record<string, string>) {
  return Response.json({ ok: false, error: message, ...(fields ? { fields } : {}) }, { status });
}

type Parsed<T> = { ok: true; data: T; ipHash: string } | { ok: false; response: Response };

/**
 * Common front door for public POST endpoints: same-origin check, size
 * limit, JSON parsing, rate limiting and schema validation.
 */
export async function parsePublicPost<S extends z.ZodType>(
  req: Request,
  schema: S,
  opts: { bucket: string; limit: number; windowSeconds: number },
): Promise<Parsed<z.output<S>>> {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return { ok: false, response: jsonError(403, "Cross-site requests are not allowed.") };
  }
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return { ok: false, response: jsonError(415, "Expected a JSON request.") };
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 32_000) {
    return { ok: false, response: jsonError(413, "That request is too large.") };
  }

  const ipHash = hashIp(clientIp(req.headers));
  try {
    const allowed = await rateLimit(`${opts.bucket}:${ipHash}`, opts.limit, opts.windowSeconds);
    if (!allowed) {
      return {
        ok: false,
        response: jsonError(429, "Too many requests. Please wait a few minutes and try again."),
      };
    }
  } catch (err) {
    // If the limiter's storage is down, the insert below will fail too and be reported.
    console.error("[rate-limit] error:", (err as Error).message);
  }

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 32_000) return { ok: false, response: jsonError(413, "That request is too large.") };
    body = JSON.parse(raw);
  } catch {
    return { ok: false, response: jsonError(400, "We couldn't read that request.") };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(422, "Please check the highlighted fields.", fieldErrors(parsed.error)),
    };
  }
  return { ok: true, data: parsed.data, ipHash };
}
