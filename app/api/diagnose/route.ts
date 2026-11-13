import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// খুব সাধারণ রেট লিমিট: প্রতি IP থেকে ঘণ্টায় ১০টি (সার্ভার চালু থাকা অবস্থায়)
const hits = new Map<string, number[]>();
const LIMIT = 10;
const WINDOW = 60 * 60 * 1000;

function limited(ip: string) {
  const t = Date.now();
  const arr = (hits.get(ip) ?? []).filter((x) => t - x < WINDOW);
  if (arr.length >= LIMIT) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(t);
  hits.set(ip, arr);
  return false;
}

const SYSTEM = `আপনি বাংলাদেশের কৃষকদের জন্য একজন অভিজ্ঞ, সহানুভূতিশীল কৃষি সহায়ক। কৃষক পাতা বা ফসলের ছবি পাঠাবেন। ছবি দেখে সমস্যা চিনে সহজ বাংলায় বলবেন।

নিয়ম:
- খুব সহজ, ছোট বাক্যে লিখুন। কঠিন শব্দ এড়ান।
- ছবি অস্পষ্ট হলে বা গাছ/ফসল না হলে is_plant=false দিন এবং কীভাবে ভালো ছবি তুলতে হবে তা note-এ বলুন (দিনের আলোতে, কাছ থেকে, আক্রান্ত পাতা ফোকাসে)।
- নিশ্চিত না হলে confidence "low" দিন। বেশি আত্মবিশ্বাসী হবেন না; একাধিক সম্ভাব্য কারণ থাকলে note-এ বলুন।
- আগে কৃষিতাত্ত্বিক ও জৈব ব্যবস্থা (আক্রান্ত অংশ সরানো, পানি ব্যবস্থাপনা, সুষম সার) বলুন। রাসায়নিকের ক্ষেত্রে শুধু সাধারণ ধরন বলুন, নির্দিষ্ট মাত্রা (ডোজ) কখনো বলবেন না। সবসময় লেবেলের নিয়ম মানতে ও স্থানীয় উপজেলা কৃষি অফিসারের সাথে কথা বলতে বলুন।
- রোগ গুরুতর, দ্রুত ছড়াচ্ছে বা আপনি নিশ্চিত নন — see_expert=true দিন।

শুধু নিচের JSON দিন, অন্য কিছু নয়:
{
  "is_plant": true/false,
  "crop": "ফসলের নাম (বাংলায়, না বুঝলে খালি)",
  "problem": "সমস্যার নাম: রোগ / পোকা / পুষ্টির ঘাটতি / সুস্থ",
  "confidence": "high" | "medium" | "low",
  "what_i_see": "ছবিতে যা দেখছি (১-২ বাক্য)",
  "treatment": ["এখন যা করবেন (ধাপে ধাপে)"],
  "prevention": ["ভবিষ্যতে যেভাবে বাঁচবেন"],
  "see_expert": true/false,
  "note": "অতিরিক্ত কথা বা সতর্কতা"
}`;

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
if (!key) {
  return NextResponse.json(
    { error: "AI সেবা এখনো চালু করা হয়নি। অ্যাডমিন GEMINI_API_KEY সেট করলে কাজ করবে।" },
      { status: 503 },
    );
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) {
    return NextResponse.json(
      { error: "আপনি অনেকবার চেষ্টা করেছেন। এক ঘণ্টা পর আবার চেষ্টা করুন।" },
      { status: 429 },
    );
  }

  let body: { image?: string; crop?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধ বোঝা যায়নি।" }, { status: 400 });
  }

  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body.image ?? "");
  if (!m || m[2].length > 6_000_000) {
    return NextResponse.json({ error: "ছবিটি ঠিক নেই বা খুব বড়। অন্য ছবি দিন।" }, { status: 400 });
  }
  const crop = (body.crop ?? "").toString().slice(0, 40);

  // অ্যাডমিনের যোগ করা তথ্য AI-কে রেফারেন্স হিসেবে দেওয়া হয়
  const { diseases } = await getDB();
  const ref = diseases
    .slice(0, 30)
    .map((d) => `- ${d.crop}: ${d.name} — লক্ষণ: ${d.symptoms} | প্রতিকার: ${d.treatment}`)
    .join("\n");

  const userText =
    (crop ? `ফসল: ${crop}\n` : "") +
    (ref ? `স্থানীয় রেফারেন্স (প্রাসঙ্গিক হলে কাজে লাগান):\n${ref}\n\n` : "") +
    "এই ছবির সমস্যা বিশ্লেষণ করুন।";

  try {
            const models = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3-flash-preview",
    ].filter((v, i, a) => a.indexOf(v) === i);

    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [
        {
          role: "user",
          parts: [
            { inline_data: { mime_type: m[1], data: m[2] } },
            { text: userText },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    });

    type GeminiResponse = {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    let data: GeminiResponse | null = null;
    const deadline = Date.now() + 52_000;

    outer: for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const left = deadline - Date.now();
        if (left < 3000) break outer;
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-goog-api-key": key,
              },
              body: payload,
              signal: AbortSignal.timeout(Math.min(left, 25_000)),
            },
          );
          if (res.ok) {
            data = await res.json();
            break outer;
          }
          console.error("Gemini error", model, res.status, await res.text().catch(() => ""));
          // শুধু সাময়িক সমস্যায় আবার চেষ্টা; অন্য error হলে সরাসরি পরের মডেলে
          if (![429, 500, 503, 504].includes(res.status)) break;
          await new Promise((r) => setTimeout(r, 1500));
        } catch (err) {
          console.error("Gemini request failed", model, err);
        }
      }
    }

    if (!data) {
      return NextResponse.json(
        { error: "AI এখন উত্তর দিতে পারছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
        { status: 502 },
      );
    };
    const text: string = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join("");
    const json = /\{[\s\S]*\}/.exec(text)?.[0];
    if (!json) throw new Error("no json");
    const r = JSON.parse(json);

    const arr = (v: unknown) => (Array.isArray(v) ? v.map(String).slice(0, 10) : []);
    return NextResponse.json({
      is_plant: r.is_plant !== false,
      crop: String(r.crop ?? ""),
      problem: String(r.problem ?? ""),
      confidence: ["high", "medium", "low"].includes(r.confidence) ? r.confidence : "low",
      what_i_see: String(r.what_i_see ?? ""),
      treatment: arr(r.treatment),
      prevention: arr(r.prevention),
      see_expert: r.see_expert === true,
      note: String(r.note ?? ""),
    });
  } catch (e) {
    console.error("diagnose failed", e);
    return NextResponse.json({ error: "ফলাফল তৈরি করা যায়নি। আরেকটি পরিষ্কার ছবি দিয়ে আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
