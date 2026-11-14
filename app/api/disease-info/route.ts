import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// সাধারণ রেট লিমিট: প্রতি IP থেকে ঘণ্টায় ২০টি
const hits = new Map<string, number[]>();
const LIMIT = 20;
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

// একই নাম বারবার খুঁজলে AI-কে আবার না ডেকে আগের উত্তর দেওয়া হয় (ফ্রি সীমা বাঁচাতে)
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 24 * 60 * 60 * 1000;
const CACHE_MAX = 200;

const SYSTEM = `আপনি বাংলাদেশের কৃষকদের জন্য একজন অভিজ্ঞ, সহানুভূতিশীল কৃষি সহায়ক। ব্যবহারকারী একটি ফসল, রোগ বা পোকার নাম লিখবেন (বানান ভুল থাকতে পারে, সঠিক নামটি বুঝে নিন)।

নিয়ম:
- নামটি ফসল হলে: বাংলাদেশে সেই ফসলের সবচেয়ে সাধারণ ৩-৪টি রোগ বা পোকার তথ্য দিন।
- নামটি কোনো রোগ বা পোকার নাম হলে: items-এ সেই রোগ বা পোকার তথ্যই দিন, আর কোন কোন ফসলে হয় তা symptoms-এ বলুন।
- নামটি ফসল, রোগ বা পোকা না হলে valid=false দিন এবং note-এ বলুন কী লিখে খুঁজতে হবে (যেমন: ধান, আলু, মাজরা পোকা)।
- খুব সহজ, ছোট বাক্যে লিখুন। কঠিন শব্দ এড়ান।
- আগে কৃষিতাত্ত্বিক ও জৈব ব্যবস্থা (আক্রান্ত অংশ সরানো, পানি ব্যবস্থাপনা, সুষম সার) বলুন। রাসায়নিকের ক্ষেত্রে শুধু সাধারণ ধরন বলুন, নির্দিষ্ট মাত্রা (ডোজ) কখনো বলবেন না। কীটনাশক ব্যবহারের আগে লেবেল পড়তে ও স্থানীয় উপজেলা কৃষি অফিসারের সাথে কথা বলতে বলুন।
- নিশ্চিত না হলে অনুমান করবেন না, বরং কম তথ্য দিন।

শুধু নিচের JSON দিন, অন্য কিছু নয়:
{
  "valid": true/false,
  "crop": "ফসল বা বিষয়ের সঠিক নাম (বাংলায়)",
  "items": [
    {
      "name": "রোগ বা পোকার নাম",
      "type": "রোগ" | "পোকা",
      "symptoms": "কীভাবে চিনবেন (১-২ বাক্য)",
      "treatment": ["এখন যা করবেন (ধাপে ধাপে)"],
      "prevention": ["ভবিষ্যতে যেভাবে বাঁচবেন"]
    }
  ],
  "note": "অতিরিক্ত কথা বা সতর্কতা"
}`;

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

async function callGemini(key: string, q: string): Promise<GeminiResponse | null> {
  const models = [
    process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
  ].filter((v, i, a) => a.indexOf(v) === i);

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: `নাম: ${q}` }] }],
    generationConfig: {
      maxOutputTokens: 4000,
      responseMimeType: "application/json",
    },
  });

  const deadline = Date.now() + 52_000;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left < 3000) return null;
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": key },
            body: payload,
            signal: AbortSignal.timeout(Math.min(left, 25_000)),
          },
        );
        if (res.ok) return (await res.json()) as GeminiResponse;
        console.error("Gemini error", model, res.status, await res.text().catch(() => ""));
        // শুধু সাময়িক সমস্যায় আবার চেষ্টা; অন্য error হলে সরাসরি পরের মডেলে
        if (![429, 500, 503, 504].includes(res.status)) break;
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        console.error("Gemini request failed", model, err);
      }
    }
  }
  return null;
}

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

  let body: { q?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধ বোঝা যায়নি।" }, { status: 400 });
  }

  const q = String(body.q ?? "").normalize("NFC").trim().slice(0, 40);
  if (!q) {
    return NextResponse.json({ error: "ফসল বা রোগ-পোকার নাম লিখুন।" }, { status: 400 });
  }

  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < TTL) {
    return NextResponse.json(hit.data);
  }

  try {
    const data = await callGemini(key, q);
    if (!data) {
      return NextResponse.json(
        { error: "AI এখন উত্তর দিতে পারছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
        { status: 502 },
      );
    }

    const text: string = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("");
    const json = /\{[\s\S]*\}/.exec(text)?.[0];
    if (!json) throw new Error("no json");
    const r = JSON.parse(json);

    const str = (v: unknown) => String(v ?? "").slice(0, 600);
    const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x)).slice(0, 8) : []);

    const items = (Array.isArray(r.items) ? r.items : [])
      .slice(0, 5)
      .map((i: Record<string, unknown>) => ({
        name: str(i.name),
        type: str(i.type),
        symptoms: str(i.symptoms),
        treatment: arr(i.treatment),
        prevention: arr(i.prevention),
      }));

    const out = {
      valid: r.valid !== false && items.length > 0,
      crop: str(r.crop),
      items,
      note: str(r.note),
    };

    if (out.valid) {
      if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      cache.set(q, { at: Date.now(), data: out });
    }

    return NextResponse.json(out);
  } catch (e) {
    console.error("disease-info failed", e);
    return NextResponse.json(
      { error: "ফলাফল তৈরি করা যায়নি। একটু পরে আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }
}