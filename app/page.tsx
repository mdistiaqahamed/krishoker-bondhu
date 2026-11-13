import Link from "next/link";
import { getDB } from "@/lib/db";
import { bnDate, taka, SEVERITY_STYLE } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await getDB();
  const announcements = db.announcements.filter((a) => a.active).slice(0, 3);
  const advisories = db.advisories.filter((a) => a.active).slice(0, 3);
  const prices = [...db.prices].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-leaf-600 to-leaf-900 p-6 text-white shadow md:p-10">
        <h1 className="text-3xl font-bold leading-tight md:text-4xl">{db.settings.siteName}</h1>
        <p className="mt-2 max-w-xl text-lg text-leaf-100">{db.settings.tagline}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/rog-chinun" className="btn bg-sun-400 text-leaf-900 hover:brightness-95">
            📷 ছবি তুলে রোগ চিনুন
          </Link>
          <Link href="/bazar-dor" className="btn bg-white/15 text-white hover:bg-white/25">
            💰 আজকের বাজার দর
          </Link>
        </div>
      </section>

      {announcements.length > 0 && (
        <section className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="card border-sun-400/50 bg-amber-50">
              <p className="font-bold text-soil-600">📢 {a.title}</p>
              <p className="mt-1 whitespace-pre-line text-stone-700">{a.body}</p>
              <p className="mt-2 text-xs text-stone-500">{bnDate(a.createdAt)}</p>
            </div>
          ))}
        </section>
      )}

      {advisories.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-bold">আবহাওয়া ও কৃষি পরামর্শ</h2>
            <Link href="/abohaowa" className="text-sm font-semibold text-leaf-700">
              সব দেখুন →
            </Link>
          </div>
          <div className="space-y-3">
            {advisories.map((a) => {
              const s = SEVERITY_STYLE[a.severity];
              return (
                <div key={a.id} className={`rounded-2xl border p-4 ${s.box}`}>
                  <p className="flex items-center gap-2 font-bold">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    {s.label}: {a.title}
                    {a.district && <span className="text-sm font-normal opacity-80">({a.district})</span>}
                  </p>
                  <p className="mt-1 whitespace-pre-line">{a.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/rog-chinun" className="card block transition hover:shadow-md">
          <div className="text-3xl">📷</div>
          <h3 className="mt-2 text-lg font-bold">রোগ চিনুন</h3>
          <p className="text-stone-600">পাতা বা ফসলের ছবি দিন, AI বলে দেবে সমস্যা কী এবং কী করবেন।</p>
        </Link>
        <Link href="/abohaowa" className="card block transition hover:shadow-md">
          <div className="text-3xl">⛅</div>
          <h3 className="mt-2 text-lg font-bold">আবহাওয়া</h3>
          <p className="text-stone-600">আপনার জেলার ৫ দিনের আবহাওয়া ও চাষাবাদের পরামর্শ।</p>
        </Link>
        <Link href="/rog-pokar-tothyo" className="card block transition hover:shadow-md">
          <div className="text-3xl">📖</div>
          <h3 className="mt-2 text-lg font-bold">রোগ-পোকার তথ্য</h3>
          <p className="text-stone-600">ফসলের সাধারণ রোগ, লক্ষণ, প্রতিকার ও প্রতিরোধের গাইড।</p>
        </Link>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold">সাম্প্রতিক বাজার দর</h2>
          <Link href="/bazar-dor" className="text-sm font-semibold text-leaf-700">
            সব দেখুন →
          </Link>
        </div>
        <div className="card divide-y divide-stone-100 p-0">
          {prices.length === 0 && <p className="p-5 text-stone-500">এখনো কোনো দাম যোগ করা হয়নি।</p>}
          {prices.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-semibold">
                  {p.crop}
                  {p.isSample && <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500">নমুনা</span>}
                </p>
                <p className="text-sm text-stone-500">
                  {p.market}, {p.district}
                </p>
              </div>
              <p className="text-lg font-bold text-leaf-700">
                {taka(p.price)} <span className="text-sm font-normal text-stone-500">/ {p.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
