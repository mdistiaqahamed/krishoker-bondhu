import Link from "next/link";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const db = await getDB();
  const samplePrices = db.prices.filter((p) => p.isSample).length;
  const sampleDiseases = db.diseases.filter((d) => d.isSample).length;
  const aiReady = !!process.env.GEMINI_API_KEY;

  const cards = [
    { href: "/admin/prices", icon: "💰", title: "বাজার দর", count: db.prices.length },
    { href: "/admin/advisories", icon: "⛅", title: "আবহাওয়া পরামর্শ", count: db.advisories.length },
    { href: "/admin/diseases", icon: "📖", title: "রোগ-পোকার তথ্য", count: db.diseases.length },
    { href: "/admin/announcements", icon: "📢", title: "ঘোষণা", count: db.announcements.length },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">ড্যাশবোর্ড</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card block transition hover:shadow-md">
            <div className="text-3xl">{c.icon}</div>
            <p className="mt-2 font-bold">{c.title}</p>
            <p className="text-3xl font-bold text-leaf-700">{c.count}</p>
          </Link>
        ))}
      </div>

      <div className="card space-y-2">
        <h2 className="font-bold">অবস্থা</h2>
        <p>{aiReady ? "✅ AI রোগ নির্ণয় চালু আছে" : "⚠️ AI রোগ নির্ণয় বন্ধ — .env.local ফাইলে GEMINI_API_KEY দিন"}</p>
        {samplePrices > 0 && (
          <p className="text-amber-800">
            ⚠️ {samplePrices}টি নমুনা দাম সাইটে দেখা যাচ্ছে। <Link href="/admin/prices" className="font-semibold underline">আসল দাম দিন</Link>
          </p>
        )}
        {sampleDiseases > 0 && (
          <p className="text-amber-800">
            ⚠️ {sampleDiseases}টি নমুনা রোগের তথ্য আছে। কৃষি বিশেষজ্ঞকে দিয়ে যাচাই করে <Link href="/admin/diseases" className="font-semibold underline">সম্পাদনা করুন</Link>
          </p>
        )}
      </div>
    </div>
  );
}
