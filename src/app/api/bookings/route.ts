import { after } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { jsonError, parsePublicPost } from "@/lib/server/api";
import { createBooking, describeBooking, notifyBooking } from "@/lib/server/bookings";
import { submittedTooFast } from "@/lib/server/request";
import { emailConfigured } from "@/lib/server/email";

export async function POST(req: Request) {
  const parsed = await parsePublicPost(req, bookingSchema, {
    bucket: "booking",
    limit: 6,
    windowSeconds: 600,
  });
  if (!parsed.ok) return parsed.response;
  const { data, ipHash } = parsed;

  if (data.website || submittedTooFast(data.startedAt, 3000)) {
    return Response.json({ ok: true, reference: null }, { status: 200 });
  }

  try {
    const result = await createBooking(data, ipHash);
    if (!result.ok) {
      return jsonError(
        409,
        "Sorry — that time is no longer available. Please choose another time.",
        { startAt: "That time was just taken. Please pick another." },
      );
    }
    const { booking, created } = result;
    if (created) after(() => notifyBooking(booking));
    return Response.json(
      {
        ok: true,
        reference: booking.reference,
        when: describeBooking(booking).label,
        confirmationEmail: emailConfigured(),
      },
      { status: created ? 201 : 200 },
    );
  } catch (err) {
    console.error("[api/bookings] failed to create booking:", (err as Error).message);
    return jsonError(500, "Something went wrong on our end and your booking was not made. Please try again.");
  }
}
