import { desc } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { isAdmin } from "@/lib/server/auth";

const COLUMNS = [
  "reference", "createdAt", "kind", "status", "name", "email", "phone", "preferredContact",
  "address", "city", "zip", "inServiceArea", "propertyType", "services", "servicesOther",
  "timeframe", "hasLights", "homeSize", "budget", "specialRequests", "propertyDetails", "notes", "message",
] as const;

function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join("; ") : String(v);
  // Neutralize spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV export of all leads. Owner-only; never cached. */
export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const csv = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
