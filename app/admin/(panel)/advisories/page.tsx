import { getDB } from "@/lib/db";
import { bnDate } from "@/lib/format";
import { saveAdvisory, deleteAdvisory } from "../../actions";
import { Field, DistrictSelect, DeleteButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

function SeveritySelect({ defaultValue = "info" }: { defaultValue?: string }) {
  return (
    <div>
      <label className="label">ধরন</label>
      <select name="severity" defaultValue={defaultValue} className="input">
        <option value="info">তথ্য</option>
        <option value="warning">সতর্কতা</option>
        <option value="danger">জরুরি</option>
      </select>
    </div>
  );
}

export default async function AdvisoriesAdmin() {
  const { advisories } = await getDB();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">⛅ আবহাওয়া ও কৃষি পরামর্শ</h1>
        <p className="text-stone-500">বন্যা, ঘূর্ণিঝড়, রোগের প্রাদুর্ভাব ইত্যাদির সতর্কতা এখানে দিন। জেলা বাছলে শুধু ওই জেলার কৃষকরা দেখবেন।</p>
      </div>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">নতুন পরামর্শ</h2>
        <form action={saveAdvisory} className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-3"><Field label="শিরোনাম" name="title" required /></div>
          <div className="md:col-span-3"><Field label="বিস্তারিত" name="body" textarea required /></div>
          <SeveritySelect />
          <DistrictSelect />
          <label className="flex items-end gap-2 pb-3 font-semibold">
            <input type="checkbox" name="active" defaultChecked className="h-5 w-5" /> সাইটে দেখান
          </label>
          <button className="btn btn-primary md:col-span-3">প্রকাশ করুন</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">সব পরামর্শ ({advisories.length})</h2>
        {advisories.map((a) => (
          <form key={a.id} action={saveAdvisory} className="card grid gap-3 md:grid-cols-3">
            <input type="hidden" name="id" value={a.id} />
            <div className="md:col-span-3"><Field label="শিরোনাম" name="title" defaultValue={a.title} required /></div>
            <div className="md:col-span-3"><Field label="বিস্তারিত" name="body" textarea defaultValue={a.body} required /></div>
            <SeveritySelect defaultValue={a.severity} />
            <DistrictSelect defaultValue={a.district} />
            <label className="flex items-end gap-2 pb-3 font-semibold">
              <input type="checkbox" name="active" defaultChecked={a.active} className="h-5 w-5" /> সাইটে দেখান
            </label>
            <div className="flex items-center gap-2 md:col-span-3">
              <button className="btn btn-primary">সেভ</button>
              <DeleteButton action={deleteAdvisory} />
              <span className="ml-auto text-xs text-stone-400">{bnDate(a.createdAt)}</span>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
