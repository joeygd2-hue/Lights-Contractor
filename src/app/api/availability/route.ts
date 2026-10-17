import { getAvailability } from "@/lib/server/bookings";
import { jsonError } from "@/lib/server/api";

/** Live availability — computed from the database on every request. */
export async function GET() {
  try {
    const data = await getAvailability();
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/availability] error:", (err as Error).message);
    return jsonError(500, "We couldn't load available times. Please try again shortly.");
  }
}
