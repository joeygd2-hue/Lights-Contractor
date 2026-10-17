import { after } from "next/server";
import { quoteSchema } from "@/lib/validation";
import { jsonError, parsePublicPost } from "@/lib/server/api";
import { createQuoteLead, notifyLead } from "@/lib/server/leads";
import { submittedTooFast } from "@/lib/server/request";
import { emailConfigured } from "@/lib/server/email";

export async function POST(req: Request) {
  const parsed = await parsePublicPost(req, quoteSchema, {
    bucket: "quote",
    limit: 5,
    windowSeconds: 600,
  });
  if (!parsed.ok) return parsed.response;
  const { data, ipHash } = parsed;

  // Bots: filled the hidden field or submitted a 5-step form in seconds.
  // Respond like a success so they don't adapt, but store nothing.
  if (data.website || submittedTooFast(data.startedAt, 4000)) {
    return Response.json({ ok: true, reference: null }, { status: 200 });
  }

  try {
    const { lead, created } = await createQuoteLead(data, ipHash);
    if (created) after(() => notifyLead(lead));
    return Response.json(
      { ok: true, reference: lead.reference, confirmationEmail: emailConfigured() },
      { status: created ? 201 : 200 },
    );
  } catch (err) {
    console.error("[api/quote] failed to save lead:", (err as Error).message);
    return jsonError(
      500,
      "Something went wrong on our end and your request was not sent. Please try again in a moment.",
    );
  }
}
