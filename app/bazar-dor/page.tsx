import { getPrices } from "@/lib/prices";
import { DISTRICT_NAMES } from "@/lib/districts";
import { bnDate, taka } from "@/lib/format";

export default async function BazarDor({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; district?: string }>;
}) {
  const { q = "", district = "" } = await searchParams;
  const all = await getPrices();

    // বাংলা অক্ষরের দুই ধরনের লেখা এক করে নেয়
const n = (s?: string) => (s ?? "").normalize("NFC").trim();

// চন্দ্রবিন্দু (ঁ) বাদ দিয়ে তুলনা, যাতে "পেয়াজ" লিখলেও "পেঁয়াজ" মেলে
const loose = (s?: string) => n(s).replace(/\u0981/g, "");

const rows = all
  .filter(
    (p) =>
      (!district || n(p.district) === n(district)) &&
      (!q || loose(p.crop).includes(loose(q)))
  )
  .sort((a, b) => (a.crop ?? "").localeCompare(b.crop ?? "", "bn"));

  // সর্বশেষ হালনাগাদের তারিখ (YYYY-MM-DD লেখা হলে এভাবেই ঠিকঠাক সাজে)
  const latest = all.reduce(
    (m, p) => (p.updated_at && p.updated_at > m ? p.updated_at : m),
    ""
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">💰 বাজার দর</h1>
        {latest && <p className="text-stone-500">সর্বশেষ হালনাগাদ: {bnDate(latest)}</p>}
      </div>

      <form className="card grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="label" htmlFor="q">ফসলের নাম</label>
          <input id="q" name="q" defaultValue={q} placeholder="যেমন: পেঁয়াজ" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="district">জেলা</label>
          <select id="district" name="district" defaultValue={district} className="input">
            <option value="">সব জেলা</option>
            {DISTRICT_NAMES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary self-end">খুঁজুন</button>
      </form>

      {rows.length === 0 ? (
        <p className="card text-stone-500">কোনো তথ্য পাওয়া যায়নি।</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((p, i) => (
            <div key={`${p.crop}-${p.district}-${p.market}-${i}`} className="card flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{p.crop}</p>
                <p className="text-stone-600">
                  {p.market}, {p.district}
                </p>
                <p className="text-xs text-stone-400">{bnDate(p.updated_at)}</p>
              </div>
              <p className="text-right text-2xl font-bold text-leaf-700">
                {taka(Number(p.price_min))} – {taka(Number(p.price_max))}
                <span className="block text-sm font-normal text-stone-500">প্রতি {p.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}