import { after } from "next/server";
import { contactSchema } from "@/lib/validation";
import { jsonError, parsePublicPost } from "@/lib/server/api";
import { createContactLead, notifyLead } from "@/lib/server/leads";
import { submittedTooFast } from "@/lib/server/request";
import { emailConfigured } from "@/lib/server/email";

export async function POST(req: Request) {
  const parsed = await parsePublicPost(req, contactSchema, {
    bucket: "contact",
    limit: 5,
    windowSeconds: 600,
  });
  if (!parsed.ok) return parsed.response;
  const { data, ipHash } = parsed;

  if (data.website || submittedTooFast(data.startedAt, 2500)) {
    return Response.json({ ok: true, reference: null }, { status: 200 });
  }

  try {
    const { lead, created } = await createContactLead(data, ipHash);
    if (created) after(() => notifyLead(lead));
    return Response.json(
      { ok: true, reference: lead.reference, confirmationEmail: emailConfigured() },
      { status: created ? 201 : 200 },
    );
  } catch (err) {
    console.error("[api/contact] failed to save message:", (err as Error).message);
    return jsonError(
      500,
      "Something went wrong on our end and your message was not sent. Please try again in a moment.",
    );
  }
}
