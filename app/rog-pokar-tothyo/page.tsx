import { getDB } from "@/lib/db";
import AiDiseaseInfo from "@/components/AiDiseaseInfo";

export const dynamic = "force-dynamic";

// চন্দ্রবিন্দু বাদ দিয়ে তুলনা করে, যাতে "পেয়াজ" লিখলেও "পেঁয়াজ" মেলে
const loose = (s?: string) => (s ?? "").normalize("NFC").replace(/\u0981/g, "").trim();

export default async function RogPokarTothyo({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { diseases } = await getDB();
  const term = q.trim();
  const rows = diseases
    .filter(
      (d) =>
        !term ||
        loose(d.name).includes(loose(term)) ||
        loose(d.crop).includes(loose(term)) ||
        loose(d.symptoms).includes(loose(term))
    )
    .sort((a, b) => a.crop.localeCompare(b.crop, "bn"));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">📖 রোগ-পোকার তথ্য</h1>

      <form className="card flex gap-3">
        <input name="q" defaultValue={q} placeholder="ফসল বা রোগের নাম লিখুন" className="input" aria-label="খুঁজুন" />
        <button className="btn btn-primary">খুঁজুন</button>
      </form>

      {rows.length === 0 &&
        (term ? (
          <AiDiseaseInfo q={term} />
        ) : (
          <p className="card text-stone-500">কিছু পাওয়া যায়নি।</p>
        ))}

      <div className="space-y-3">
        {rows.map((d) => (
          <details key={d.id} className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span>
                <span className="text-lg font-bold">{d.name}</span>
                <span className="ml-2 rounded-full bg-leaf-100 px-2 py-0.5 text-sm text-leaf-700">{d.crop}</span>
              </span>
              <span className="text-leaf-600 transition group-open:rotate-180">▼</span>
            </summary>
            <div className="mt-4 space-y-3 text-stone-700">
              <Block title="🔍 লক্ষণ" text={d.symptoms} />
              <Block title="💊 প্রতিকার" text={d.treatment} />
              <Block title="🛡️ প্রতিরোধ" text={d.prevention} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <p className="font-bold text-leaf-700">{title}</p>
      <p className="whitespace-pre-line">{text}</p>
    </div>
  );
}
