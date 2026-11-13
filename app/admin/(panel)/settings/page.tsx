import { getDB } from "@/lib/db";
import { saveSettings } from "../../actions";
import { Field } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  const { settings: s } = await getDB();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">🔧 সাইট সেটিংস</h1>
      <form action={saveSettings} className="card grid gap-3 md:grid-cols-2">
        <Field label="সাইটের নাম" name="siteName" defaultValue={s.siteName} required />
        <Field label="স্লোগান (হোম পেজে)" name="tagline" defaultValue={s.tagline} />
        <Field label="হেল্পলাইন নম্বর" name="helpline" defaultValue={s.helpline} />
        <Field label="হেল্পলাইনের নাম" name="helplineLabel" defaultValue={s.helplineLabel} />
        <div className="md:col-span-2">
          <Field label="ফুটারের সতর্কবার্তা" name="footerNote" textarea defaultValue={s.footerNote} />
        </div>
        <button className="btn btn-primary md:col-span-2">সেভ করুন</button>
      </form>
    </div>
  );
}
