import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "klfw_admin";
const SESSION_HOURS = 12;

function secret(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", `klfw-admin-session:${secret()}`)
    .update(payload)
    .digest("hex");
}

export function makeSessionToken(): string {
  const exp = String(Date.now() + SESSION_HOURS * 3600 * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string): boolean {
  if (!secret()) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function passwordMatches(candidate: string): boolean {
  const s = secret();
  if (!s) return false;
  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return Boolean(token && verifySessionToken(token));
}
