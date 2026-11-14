"use client";

import { useRef, useState } from "react";

type Result = {
  is_plant: boolean;
  crop: string;
  problem: string;
  confidence: "high" | "medium" | "low";
  what_i_see: string;
  treatment: string[];
  prevention: string[];
  see_expert: boolean;
  note: string;
};

const CONF = {
  high: { label: "বেশ নিশ্চিত", cls: "bg-leaf-100 text-leaf-700" },
  medium: { label: "মোটামুটি নিশ্চিত", cls: "bg-amber-100 text-amber-800" },
  low: { label: "কম নিশ্চিত", cls: "bg-red-100 text-red-800" },
} as const;

// ছবি ছোট করে পাঠানো হয়, যাতে কম ইন্টারনেটেও দ্রুত যায়
async function shrink(file: File, max = 1280): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

export default function DiagnoseClient({ helpline, helplineLabel }: { helpline: string; helplineLabel: string }) {
  const [preview, setPreview] = useState<string>("");
  const [crop, setCrop] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr("");
    setRes(null);
    try {
      setPreview(await shrink(f));
    } catch {
      setErr("ছবিটি পড়া যায়নি। অন্য একটি ছবি বেছে নিন।");
    }
  }

  async function analyze() {
    if (!preview) return;
    setLoading(true);
    setErr("");
    setRes(null);
    try {
      const r = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: preview, crop }),
      });
      const d = await r.json();
      if (!r.ok) setErr(d.error ?? "কিছু একটা সমস্যা হয়েছে।");
      else setRes(d);
    } catch {
      setErr("ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview("");
    setRes(null);
    setErr("");
    if (fileRef.current) fileRef.current.value = "";
    if (galRef.current) galRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        {/* ক্যামেরা: capture থাকায় ফোনে সরাসরি ক্যামেরা খোলে */}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" id="photo-cam" />
        {/* গ্যালারি: capture নেই, তাই ফোনের ছবির তালিকা খোলে */}
        <input ref={galRef} type="file" accept="image/*" onChange={onPick} className="hidden" id="photo-gal" />

        {!preview ? (
          <div className="rounded-2xl border-2 border-dashed border-leaf-200 bg-leaf-50 px-4 py-8 text-center">
            <p className="text-lg font-bold text-leaf-700">আক্রান্ত পাতার ছবি দিন</p>
            <p className="mt-1 text-sm text-stone-500">কাছ থেকে, দিনের আলোতে তুলুন</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label htmlFor="photo-cam" className="btn btn-primary cursor-pointer text-lg">📷 ক্যামেরা</label>
              <label htmlFor="photo-gal" className="btn cursor-pointer border border-leaf-200 bg-white text-lg text-leaf-700">🖼️ গ্যালারি</label>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="আপনার তোলা ছবি" className="max-h-80 w-full rounded-2xl object-contain bg-stone-100" />
            <button type="button" onClick={reset} className="text-sm font-semibold text-red-600">
              ✕ ছবি বদলান
            </button>
          </div>
        )}

        <div>
          <label className="label" htmlFor="crop">ফসলের নাম (জানা থাকলে)</label>
          <input id="crop" className="input" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="যেমন: ধান, আলু, টমেটো" maxLength={40} />
        </div>

        <button onClick={analyze} disabled={!preview || loading} className="btn btn-primary w-full text-lg">
          {loading ? "বিশ্লেষণ হচ্ছে… একটু অপেক্ষা করুন" : "🔍 রোগ চিনুন"}
        </button>
      </div>

      {err && <p className="card border-red-200 bg-red-50 text-red-800">{err}</p>}

      {res && !res.is_plant && (
        <div className="card border-amber-300 bg-amber-50">
          <p className="font-bold text-amber-900">ছবি থেকে বোঝা যায়নি</p>
          <p className="mt-1">{res.note || "আরেকটি পরিষ্কার ছবি তুলুন — আক্রান্ত পাতা কাছ থেকে, দিনের আলোতে।"}</p>
        </div>
      )}

      {res && res.is_plant && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex flex-wrap items-center gap-2">
              {res.crop && <span className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-semibold text-leaf-700">{res.crop}</span>}
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${CONF[res.confidence].cls}`}>{CONF[res.confidence].label}</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold">{res.problem}</h2>
            {res.what_i_see && <p className="mt-2 text-stone-700">{res.what_i_see}</p>}
          </div>

          {res.treatment.length > 0 && (
            <div className="card">
              <h3 className="mb-2 text-lg font-bold text-leaf-700">💊 এখন যা করবেন</h3>
              <ol className="list-decimal space-y-1.5 pl-5">
                {res.treatment.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
            </div>
          )}

          {res.prevention.length > 0 && (
            <div className="card">
              <h3 className="mb-2 text-lg font-bold text-leaf-700">🛡️ ভবিষ্যতে বাঁচতে</h3>
              <ul className="list-disc space-y-1.5 pl-5">
                {res.prevention.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {res.note && <p className="card bg-stone-50 text-stone-700">ℹ️ {res.note}</p>}

          <div className={`card ${res.see_expert ? "border-red-300 bg-red-50" : "bg-leaf-50"}`}>
            <p className="font-bold">{res.see_expert ? "⚠️ বিশেষজ্ঞের সাথে কথা বলুন" : "👨‍🌾 নিশ্চিত হতে"}</p>
            <p className="mt-1">
              কীটনাশক বা ওষুধ ব্যবহারের আগে স্থানীয় উপজেলা কৃষি অফিসারের পরামর্শ নিন এবং লেবেলের নিয়ম মানুন।
              {helpline && <> {helplineLabel}: <b>{helpline}</b></>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
