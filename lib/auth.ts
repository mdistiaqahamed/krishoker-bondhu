import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "kb_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 দিন

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET সেট করা নেই (.env.local দেখুন)");
  return s;
}

const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

const sha = (v: string) => crypto.createHash("sha256").update(v).digest();

export function checkPassword(input: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false; // পাসওয়ার্ড সেট না থাকলে কেউ ঢুকতে পারবে না
  return crypto.timingSafeEqual(sha(input), sha(real));
}

export async function createSession() {
  const exp = String(Date.now() + MAX_AGE * 1000);
  const jar = await cookies();
  jar.set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig) return false;
  const expected = sign(exp);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(exp) > Date.now();
}

/** প্রতিটি অ্যাডমিন পেজ ও অ্যাকশনের শুরুতে কল করুন */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
