"use client";

import { useEffect, useState } from "react";
import { DISTRICTS } from "@/lib/districts";
import type { Advisory } from "@/lib/db";
import { SEVERITY_STYLE } from "@/lib/format";

type Weather = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
    wind_speed_10m_max: number[];
  };
};

const nf = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });
const n = (v: number) => nf.format(Math.round(v));

function describe(code: number): [string, string] {
  if (code === 0) return ["☀️", "পরিষ্কার আকাশ"];
  if (code <= 3) return ["⛅", "আংশিক মেঘলা"];
  if (code === 45 || code === 48) return ["🌫️", "কুয়াশা"];
  if (code >= 51 && code <= 57) return ["🌦️", "গুঁড়ি গুঁড়ি বৃষ্টি"];
  if (code >= 61 && code <= 67) return ["🌧️", "বৃষ্টি"];
  if (code >= 80 && code <= 82) return ["🌧️", "ঝমঝম বৃষ্টি"];
  if (code >= 95) return ["⛈️", "বজ্রসহ বৃষ্টি"];
  return ["☁️", "মেঘলা"];
}

function farmTips(w: Weather): string[] {
  const tips: string[] = [];
  const next = (arr: number[]) => arr.slice(0, 2);
  const rainProb = Math.max(...next(w.daily.precipitation_probability_max));
  const rainSum = next(w.daily.precipitation_sum).reduce((a, b) => a + b, 0);
  const thunder = next(w.daily.weather_code).some((c) => c >= 95);
  const maxT = Math.max(...next(w.daily.temperature_2m_max));
  const minT = Math.min(...next(w.daily.temperature_2m_min));
  const wind = Math.max(...next(w.daily.wind_speed_10m_max));

  if (thunder) tips.push("⚡ বজ্রসহ বৃষ্টির আশঙ্কা আছে। মাঠে কাজ এড়িয়ে নিরাপদ আশ্রয়ে থাকুন।");
  if (rainProb >= 60 || rainSum >= 10)
    tips.push("🌧️ আগামী দুই দিনে বৃষ্টির সম্ভাবনা বেশি। সার, কীটনাশক স্প্রে ও সেচ পিছিয়ে দিন। পাকা ফসল কেটে নিরাপদে রাখুন।");
  if (maxT >= 36) tips.push("🥵 খুব গরম পড়বে। দুপুরে মাঠে কাজ না করে সকাল-বিকেলে করুন। ফসলে পর্যাপ্ত সেচ দিন।");
  if (minT <= 12) tips.push("🥶 ঠান্ডা পড়বে। কচি চারা ঢেকে রাখুন, সম্ভব হলে হালকা সেচ দিন।");
  if (wind >= 30) tips.push("💨 ঝোড়ো হাওয়ার সম্ভাবনা। লম্বা গাছে ঠেস দিন, স্প্রে করা থেকে বিরত থাকুন।");
  if (w.current.relative_humidity_2m >= 85 && w.current.temperature_2m >= 15 && w.current.temperature_2m <= 30)
    tips.push("🍄 আর্দ্রতা বেশি, ছত্রাকজনিত রোগের ঝুঁকি আছে। জমি নিয়মিত দেখুন, রোগের লক্ষণ পেলে কৃষি অফিসারকে জানান।");
  if (tips.length === 0) tips.push("✅ আগামী দুই দিন আবহাওয়া মোটামুটি স্থিতিশীল। স্বাভাবিক কাজ চালিয়ে যেতে পারেন।");
  return tips;
}

export default function WeatherClient({ advisories }: { advisories: Advisory[] }) {
  const [idx, setIdx] = useState(0);
  const [w, setW] = useState<Weather | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [name, lat, lon] = DISTRICTS[idx];

  useEffect(() => {
    const saved = localStorage.getItem("kb_district");
    if (saved) {
      const i = DISTRICTS.findIndex((d) => d[0] === saved);
      if (i >= 0) setIdx(i);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setErr("");
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,wind_speed_10m_max` +
      `&timezone=Asia%2FDhaka&forecast_days=5`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setW(d))
      .catch((e) => {
        if (e?.name !== "AbortError") setErr("আবহাওয়ার তথ্য আনা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [lat, lon]);

  const local = advisories.filter((a) => a.district === "" || a.district === name);
  const [icon, label] = w ? describe(w.current.weather_code) : ["", ""];

  return (
    <div className="space-y-5">
      <div className="card">
        <label className="label" htmlFor="dist">আপনার জেলা</label>
        <select
          id="dist"
          className="input"
          value={idx}
          onChange={(e) => {
            const i = Number(e.target.value);
            setIdx(i);
            try { localStorage.setItem("kb_district", DISTRICTS[i][0]); } catch {}
          }}
        >
          {DISTRICTS.map((d, i) => (
            <option key={d[0]} value={i}>{d[0]}</option>
          ))}
        </select>
      </div>

      {local.length > 0 && (
        <div className="space-y-3">
          {local.map((a) => {
            const s = SEVERITY_STYLE[a.severity];
            return (
              <div key={a.id} className={`rounded-2xl border p-4 ${s.box}`}>
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                  {s.label}: {a.title}
                  <span className="text-sm font-normal opacity-80">({a.district || "সারা দেশ"})</span>
                </p>
                <p className="mt-1 whitespace-pre-line">{a.body}</p>
              </div>
            );
          })}
        </div>
      )}

      {loading && <p className="card text-stone-500">আবহাওয়ার তথ্য আনা হচ্ছে…</p>}
      {err && <p className="card border-red-200 bg-red-50 text-red-800">{err}</p>}

      {w && !loading && (
        <>
          <div className="card flex flex-wrap items-center gap-5">
            <div className="text-6xl">{icon}</div>
            <div>
              <p className="text-4xl font-bold">{n(w.current.temperature_2m)}°C</p>
              <p className="text-stone-600">{name} • এখন {label}</p>
            </div>
            <div className="ml-auto grid grid-cols-2 gap-x-6 text-stone-600">
              <p>💧 আর্দ্রতা {n(w.current.relative_humidity_2m)}%</p>
              <p>💨 বাতাস {n(w.current.wind_speed_10m)} কিমি/ঘণ্টা</p>
            </div>
          </div>

          <div className="card space-y-2 bg-leaf-50">
            <p className="font-bold text-leaf-700">🌱 চাষাবাদের জন্য পরামর্শ</p>
            <ul className="space-y-2">
              {farmTips(w).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="text-xs text-stone-500">আবহাওয়ার পূর্বাভাস থেকে স্বয়ংক্রিয়ভাবে তৈরি। নির্দিষ্ট ফসলের জন্য কৃষি অফিসারের পরামর্শ নিন।</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {w.daily.time.map((day, i) => {
              const [ic, lb] = describe(w.daily.weather_code[i]);
              const date = new Date(day).toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "short" });
              return (
                <div key={day} className="card p-3 text-center">
                  <p className="text-sm font-semibold">{i === 0 ? "আজ" : date}</p>
                  <p className="my-1 text-3xl">{ic}</p>
                  <p className="text-xs text-stone-500">{lb}</p>
                  <p className="mt-1 font-bold">
                    {n(w.daily.temperature_2m_max[i])}° <span className="font-normal text-stone-500">{n(w.daily.temperature_2m_min[i])}°</span>
                  </p>
                  <p className="text-xs text-sky-700">🌧 {n(w.daily.precipitation_probability_max[i] ?? 0)}%</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-stone-400">আবহাওয়া তথ্যের উৎস: Open-Meteo</p>
        </>
      )}
    </div>
  );
}
