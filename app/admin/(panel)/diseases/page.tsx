import { getDB } from "@/lib/db";
import { saveDisease, deleteDisease } from "../../actions";
import { Field, DeleteButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function DiseasesAdmin() {
  const { diseases } = await getDB();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">📖 রোগ-পোকার তথ্য</h1>
        <p className="text-stone-500">
          এখানে যা যোগ করবেন তা “রোগ-পোকা” পাতায় দেখা যাবে এবং AI রোগ নির্ণয়ের সময় রেফারেন্স হিসেবেও কাজে লাগবে। তথ্য কৃষি বিশেষজ্ঞকে দিয়ে যাচাই করে নিন।
        </p>
      </div>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">নতুন তথ্য যোগ</h2>
        <form action={saveDisease} className="grid gap-3 md:grid-cols-2">
          <Field label="রোগ/পোকার নাম" name="name" required />
          <Field label="ফসল" name="crop" required />
          <div className="md:col-span-2"><Field label="লক্ষণ" name="symptoms" textarea /></div>
          <div className="md:col-span-2"><Field label="প্রতিকার" name="treatment" textarea /></div>
          <div className="md:col-span-2"><Field label="প্রতিরোধ" name="prevention" textarea /></div>
          <button className="btn btn-primary md:col-span-2">যোগ করুন</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">সব তথ্য ({diseases.length})</h2>
        {diseases.map((d) => (
          <details key={d.id} className="card">
            <summary className="cursor-pointer font-bold">
              {d.name} <span className="font-normal text-stone-500">— {d.crop}</span>
              {d.isSample && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800">নমুনা — যাচাই করুন</span>}
            </summary>
            <form action={saveDisease} className="mt-4 grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={d.id} />
              <Field label="রোগ/পোকার নাম" name="name" defaultValue={d.name} required />
              <Field label="ফসল" name="crop" defaultValue={d.crop} required />
              <div className="md:col-span-2"><Field label="লক্ষণ" name="symptoms" textarea rows={4} defaultValue={d.symptoms} /></div>
              <div className="md:col-span-2"><Field label="প্রতিকার" name="treatment" textarea rows={4} defaultValue={d.treatment} /></div>
              <div className="md:col-span-2"><Field label="প্রতিরোধ" name="prevention" textarea rows={4} defaultValue={d.prevention} /></div>
              <div className="flex gap-2 md:col-span-2">
                <button className="btn btn-primary">সেভ</button>
                <DeleteButton action={deleteDisease} />
              </div>
            </form>
          </details>
        ))}
      </section>
    </div>
  );
}
