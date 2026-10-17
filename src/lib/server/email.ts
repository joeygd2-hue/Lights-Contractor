import "server-only";

/**
 * Email delivery via Resend's HTTP API (https://resend.com/docs/api-reference).
 * When RESEND_API_KEY / EMAIL_FROM aren't set, emails are skipped — the lead
 * is still saved and visible in the admin dashboard.
 */

export type EmailResult = "sent" | "skipped" | "failed";

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function ownerEmail(): string | null {
  return process.env.OWNER_NOTIFICATION_EMAIL || null;
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!emailConfigured()) {
    console.info(`[email] skipped (not configured): "${msg.subject}"`);
    return "skipped";
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        html: msg.html,
        reply_to: msg.replyTo,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Log status only — never the body, which can echo customer data.
      console.error(`[email] provider rejected message: HTTP ${res.status}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[email] send failed:", (err as Error).name);
    return "failed";
  }
}

/* ───────────────────────── Templates ───────────────────────── */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Row = [label: string, value: string | null | undefined];

/** Simple, readable transactional layout that renders well in every client. */
export function renderEmail({
  heading,
  intro,
  rows = [],
  outro,
  siteName,
}: {
  heading: string;
  intro: string[];
  rows?: Row[];
  outro?: string[];
  siteName: string;
}): { html: string; text: string } {
  const visible = rows.filter(([, v]) => v && v.trim() !== "");
  const html = `<!doctype html><html><body style="margin:0;background:#faf6ee;padding:24px;font-family:Helvetica,Arial,sans-serif;color:#24231f">
<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fffdf8;border:1px solid #e2d9c6">
<tr><td style="background:#142a20;padding:20px 28px;color:#dcc79b;font-family:Georgia,serif;font-size:18px">${escapeHtml(siteName)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:normal;font-size:24px;color:#142a20">${escapeHtml(heading)}</h1>
${intro.map((p) => `<p style="margin:0 0 14px;line-height:1.6">${escapeHtml(p)}</p>`).join("")}
${
  visible.length
    ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin:18px 0">${visible
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 12px 8px 0;border-top:1px solid #e2d9c6;color:#5a574f;vertical-align:top;width:38%;font-size:14px">${escapeHtml(k)}</td><td style="padding:8px 0;border-top:1px solid #e2d9c6;font-size:14px;white-space:pre-wrap">${escapeHtml(v!)}</td></tr>`,
        )
        .join("")}</table>`
    : ""
}
${(outro ?? []).map((p) => `<p style="margin:0 0 14px;line-height:1.6">${escapeHtml(p)}</p>`).join("")}
</td></tr></table></body></html>`;
  const text = [
    heading,
    "",
    ...intro,
    "",
    ...visible.map(([k, v]) => `${k}: ${v}`),
    "",
    ...(outro ?? []),
    "",
    `— ${siteName}`,
  ].join("\n");
  return { html, text };
}
