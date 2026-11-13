import Papa from "papaparse";

export type PriceRow = {
  crop: string;
  district: string;
  market: string;
  unit: string;
  price_min: string;
  price_max: string;
  updated_at: string;
  status: string;
};

export async function getPrices(): Promise<PriceRow[]> {
  const url = process.env.SHEET_CSV_URL;
  if (!url) {
    console.error("SHEET_CSV_URL .env.local এ সেট করা নেই");
    return [];
  }

  try {
    // পরীক্ষার সময় ৬০ সেকেন্ড; পরে ৩৬০০ (১ ঘণ্টা) করবেন
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];

    const text = await res.text();
    const { data } = Papa.parse<PriceRow>(text, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (h) => h.replace(/^\uFEFF/, "").trim().toLowerCase(),
});

    // শুধু অনুমোদিত দাম
       const approved = data.filter(
      (r) => r.status?.trim() === "approved" && r.crop
    );

    // প্রতিটি (ফসল + জেলা + বাজার)-এর শুধু সবচেয়ে নতুন দাম রাখে
    const clean = (s?: string) => (s ?? "").normalize("NFC").trim();
    const latest = new Map<string, PriceRow>();
    for (const r of approved) {
      const key = [r.crop, r.district, r.market].map(clean).join("|");
      const old = latest.get(key);
      if (!old || (r.updated_at ?? "") > (old.updated_at ?? "")) {
        latest.set(key, r);
      }
    }
    return [...latest.values()];
  } catch (e) {
    console.error("শিট থেকে দাম আনা যায়নি:", e);
    return [];
  }
}