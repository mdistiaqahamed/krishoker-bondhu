"use client";

import { useEffect, useState } from "react";

type Item = {
  name: string;
  type: string;
  symptoms: string;
  treatment: string[];
  prevention: string[];
};

type Info = {
  valid: boolean;
  crop: string;
  items: Item[];
  note: string;
};

export default function AiDiseaseInfo({ q }: { q: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setErr("");
    setInfo(null);

    fetch("/api/disease-info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ q }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "কিছু একটা সমস্যা হয়েছে।");
        setInfo(d as Info);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setErr(e instanceof Error ? e.message : "ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [q]);

  if (loading) {
    return (
      <div className="card bg-leaf-50">
        <p className="font-bold text-leaf-700">🤖 AI আপনার জন্য তথ্য খুঁজছে…</p>
        <p className="mt-1 text-sm text-stone-600">একটু অপেক্ষা করুন, কয়েক সেকেন্ড লাগতে পারে।</p>
      </div>
    );
  }

  if (err) {
    return <p className="card border-red-200 bg-red-50 text-red-800">{err}</p>;
  }

  if (!info || !info.valid) {
    return (
      <div className="card border-amber-300 bg-amber-50">
        <p className="font-bold text-amber-900">তথ্য পাওয়া যায়নি</p>
        <p className="mt-1">
          {info?.note || "ফসলের নাম (যেমন: ধান, আলু, টমেটো) বা রোগ-পোকার নাম লিখে খুঁজুন।"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card bg-leaf-50">
        <p className="text-sm font-semibold text-leaf-700">🤖 AI-র দেওয়া তথ্য</p>
        <h2 className="mt-1 text-xl font-bold">{info.crop || q}</h2>
      </div>

      {info.items.map((it, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{it.name}</h3>
            {it.type && (
              <span className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-semibold text-leaf-700">
                {it.type}
              </span>
            )}
          </div>

          {it.symptoms && (
            <p className="text-stone-700">
              <b>চিনবেন যেভাবে:</b> {it.symptoms}
            </p>
          )}

          {it.treatment.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-leaf-700">💊 এখন যা করবেন</p>
              <ol className="list-decimal space-y-1 pl-5">
                {it.treatment.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ol>
            </div>
          )}

          {it.prevention.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-leaf-700">🛡️ ভবিষ্যতে বাঁচতে</p>
              <ul className="list-disc space-y-1 pl-5">
                {it.prevention.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {info.note && <p className="card bg-stone-50 text-stone-700">ℹ️ {info.note}</p>}

      <div className="card border-amber-300 bg-amber-50">
        <p className="font-bold text-amber-900">⚠️ মনে রাখবেন</p>
        <p className="mt-1">
          এই তথ্য AI তৈরি করেছে, ভুল হতে পারে। কীটনাশক বা ওষুধ ব্যবহারের আগে স্থানীয় উপজেলা কৃষি
          অফিসারের পরামর্শ নিন এবং লেবেলের নিয়ম মানুন।
        </p>
      </div>
    </div>
  );
}