import { useEffect, useRef } from "react";

export type SubmitResult =
  | { ok: true; reference: string | null; data?: Record<string, unknown> }
  | { ok: false; error: string; fields?: Record<string, string>; status: number };

/** POST JSON to one of our API routes and normalize the response. */
export async function postJson(url: string, body: unknown): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      error: "We couldn't reach the server. Please check your connection and try again.",
    };
  }
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    /* fall through to generic error */
  }
  if (res.ok && json.ok) {
    return { ok: true, reference: (json.reference as string | null) ?? null, data: json };
  }
  return {
    ok: false,
    status: res.status,
    error: (json.error as string) ?? "Something went wrong. Please try again.",
    fields: json.fields as Record<string, string> | undefined,
  };
}

/**
 * Moves focus to the first invalid field (within `root`, the form) so
 * keyboard and screen-reader users land on it.
 */
export function focusFirstError(fields: Record<string, string>, root: HTMLElement | null) {
  const first = Object.keys(fields)[0];
  if (!first || !root) return;
  requestAnimationFrame(() => {
    const el = root.querySelector<HTMLElement>(`[data-field="${first.split(".")[0]}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

/**
 * Anti-spam/idempotency metadata for a form session. Created after mount
 * (not during render) so server prerendering stays deterministic.
 * Call `reset()` after a successful submission to allow a new one.
 */
export function useFormMeta() {
  const ref = useRef<{ startedAt: number; idempotencyKey: string } | null>(null);
  useEffect(() => {
    ref.current ??= { startedAt: Date.now(), idempotencyKey: crypto.randomUUID() };
  }, []);
  return {
    get: () => (ref.current ??= { startedAt: Date.now(), idempotencyKey: crypto.randomUUID() }),
    reset: () => {
      ref.current = { startedAt: Date.now(), idempotencyKey: crypto.randomUUID() };
    },
  };
}
