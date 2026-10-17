import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Fixed-window rate limiter stored in Postgres, so it works across
 * serverless instances without extra infrastructure.
 * Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN now()
        ELSE rate_limits.window_start
      END
    RETURNING count
  `);
  return Number(result.rows[0]?.count ?? 0) <= limit;
}
