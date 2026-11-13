import DiagnoseClient from "@/components/DiagnoseClient";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RogChinun() {
  const { settings } = await getDB();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">📷 রোগ চিনুন</h1>
        <p className="text-stone-600">পাতা বা ফসলের ছবি দিন। AI সমস্যা চিনে সহজ বাংলায় বলে দেবে।</p>
      </div>
      <DiagnoseClient helpline={settings.helpline} helplineLabel={settings.helplineLabel} />
    </div>
  );
}
