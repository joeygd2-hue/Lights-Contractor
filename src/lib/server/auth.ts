import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { adminSessions } from "@/db/schema";
import { site } from "@/config/site";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

export const SESSION_COOKIE = "slls_admin";
const SESSION_DAYS = 7;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/**
 * Password hashes look like: scrypt:<saltBase64>:<hashBase64> (colons, not "$", so .env
 * variable expansion can't mangle them)
 * Generate one with: npm run admin:hash -- "your password"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split(":");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, SCRYPT);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function safeEqualStrings(a: string, b: string) {
  const ha = Buffer.from(sha256(a.trim().toLowerCase()));
  const hb = Buffer.from(sha256(b.trim().toLowerCase()));
  return timingSafeEqual(ha, hb);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH);
}

/** Checks credentials against ADMIN_EMAIL / ADMIN_PASSWORD_HASH. */
export async function checkCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) return false;
  // Always run the expensive hash so timing doesn't reveal which part failed.
  const passwordOk = await verifyPassword(password, adminHash);
  return safeEqualStrings(email, adminEmail) && passwordOk;
}

export async function createSession(): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(adminSessions).values({ tokenHash: sha256(token), expiresAt });
  // Opportunistic cleanup of expired sessions.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Secure everywhere except plain-http local previews (http://localhost),
    // where some browsers (Safari) would otherwise drop the cookie.
    secure: process.env.NODE_ENV === "production" && !site.url.startsWith("http://"),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** Returns true when the request carries a valid, unexpired admin session. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const [row] = await db
    .select({ tokenHash: adminSessions.tokenHash })
    .from(adminSessions)
    .where(and(eq(adminSessions.tokenHash, sha256(token)), gt(adminSessions.expiresAt, new Date())));
  return Boolean(row);
}

/**
 * Call at the top of every admin page component, server action and admin
 * route handler. The proxy only does a cheap cookie-presence check; this is
 * the real authorization.
 */
export async function requireAdmin(): Promise<void> {
  // Admin data is always per-request; never prerender anything after this point.
  await connection();
  if (!(await isAdmin())) redirect("/admin/login");
}
