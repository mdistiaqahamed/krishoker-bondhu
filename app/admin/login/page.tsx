import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { login } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const configured = !!process.env.ADMIN_PASSWORD && !!process.env.SESSION_SECRET;

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <form action={login} className="card space-y-4">
        <h1 className="text-2xl font-bold">🔐 অ্যাডমিন লগইন</h1>
        {!configured && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            ADMIN_PASSWORD ও SESSION_SECRET সেট করা নেই। <code>.env.local</code> ফাইল দেখুন।
          </p>
        )}
        {error && <p className="rounded-xl bg-red-50 p-3 text-red-800">পাসওয়ার্ড ভুল হয়েছে।</p>}
        <div>
          <label className="label" htmlFor="password">পাসওয়ার্ড</label>
          <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="input" />
        </div>
        <button className="btn btn-primary w-full">লগইন</button>
      </form>
    </div>
  );
}
