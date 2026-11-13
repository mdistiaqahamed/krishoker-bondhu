import { getDB } from "@/lib/db";
import { bnDate } from "@/lib/format";
import { savePrice, deletePrice, importPrices, clearSamplePrices } from "../../actions";
import { Field, DistrictSelect, DeleteButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function PricesAdmin() {
  const { prices } = await getDB();
  const rows = [...prices].sort((a, b) => a.crop.localeCompare(b.crop, "bn"));
  const hasSample = prices.some((p) => p.isSample);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">💰 বাজার দর</h1>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">নতুন দাম যোগ করুন</h2>
        <form action={savePrice} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="ফসল" name="crop" required placeholder="পেঁয়াজ" />
          <Field label="একক" name="unit" defaultValue="কেজি" />
          <Field label="দাম (৳)" name="price" type="number" step="any" required />
          <Field label="বাজার" name="market" placeholder="কারওয়ান বাজার" />
          <DistrictSelect allLabel="জেলা বাছুন" />
          <button className="btn btn-primary self-end">যোগ করুন</button>
        </form>
      </section>

      <section className="card">
        <h2 className="mb-1 text-lg font-bold">একসাথে অনেক দাম যোগ করুন</h2>
        <p className="mb-3 text-sm text-stone-500">প্রতি লাইনে একটি: <code>ফসল,একক,দাম,বাজার,জেলা</code></p>
        <form action={importPrices} className="space-y-3">
          <textarea name="rows" rows={5} className="input font-mono text-sm" placeholder={"পেঁয়াজ,কেজি,70,কারওয়ান বাজার,ঢাকা\nআলু,কেজি,30,বগুড়া সদর,বগুড়া"} />
          <button className="btn btn-primary">যোগ করুন</button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">সব দাম ({rows.length})</h2>
          {hasSample && (
            <form action={clearSamplePrices}>
              <button className="btn btn-ghost text-sm">নমুনা দামগুলো মুছুন</button>
            </form>
          )}
        </div>

        {rows.map((p) => (
          <form key={p.id} action={savePrice} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <input type="hidden" name="id" value={p.id} />
            <Field label="ফসল" name="crop" defaultValue={p.crop} required />
            <Field label="একক" name="unit" defaultValue={p.unit} />
            <Field label="দাম (৳)" name="price" type="number" step="any" defaultValue={p.price} required />
            <Field label="বাজার" name="market" defaultValue={p.market} />
            <DistrictSelect defaultValue={p.district} allLabel="জেলা বাছুন" />
            <div className="flex items-end gap-2">
              <button className="btn btn-primary">সেভ</button>
              <DeleteButton action={deletePrice} />
            </div>
            <p className="text-xs text-stone-400 lg:col-span-6">
              {p.isSample ? "⚠️ নমুনা তথ্য — সেভ করলে আসল হয়ে যাবে • " : ""}
              সর্বশেষ: {bnDate(p.updatedAt)}
            </p>
          </form>
        ))}
      </section>
    </div>
  );
}
