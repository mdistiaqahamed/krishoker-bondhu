import { getDB } from "@/lib/db";
import { bnDate } from "@/lib/format";
import { saveAnnouncement, deleteAnnouncement } from "../../actions";
import { Field, DeleteButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AnnouncementsAdmin() {
  const { announcements } = await getDB();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">📢 ঘোষণা</h1>
        <p className="text-stone-500">হোম পেজের উপরে সর্বশেষ ৩টি সক্রিয় ঘোষণা দেখা যায় (সার বিতরণ, কৃষক প্রশিক্ষণ, মেলা ইত্যাদি)।</p>
      </div>

      <section className="card">
        <h2 className="mb-3 text-lg font-bold">নতুন ঘোষণা</h2>
        <form action={saveAnnouncement} className="space-y-3">
          <Field label="শিরোনাম" name="title" required />
          <Field label="বিস্তারিত" name="body" textarea />
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" name="active" defaultChecked className="h-5 w-5" /> সাইটে দেখান
          </label>
          <button className="btn btn-primary">প্রকাশ করুন</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">সব ঘোষণা ({announcements.length})</h2>
        {announcements.length === 0 && <p className="text-stone-500">এখনো কোনো ঘোষণা নেই।</p>}
        {announcements.map((a) => (
          <form key={a.id} action={saveAnnouncement} className="card space-y-3">
            <input type="hidden" name="id" value={a.id} />
            <Field label="শিরোনাম" name="title" defaultValue={a.title} required />
            <Field label="বিস্তারিত" name="body" textarea defaultValue={a.body} />
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" name="active" defaultChecked={a.active} className="h-5 w-5" /> সাইটে দেখান
            </label>
            <div className="flex items-center gap-2">
              <button className="btn btn-primary">সেভ</button>
              <DeleteButton action={deleteAnnouncement} />
              <span className="ml-auto text-xs text-stone-400">{bnDate(a.createdAt)}</span>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
