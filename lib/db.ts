import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { unstable_noStore as noStore } from "next/cache";

/**
 * ডেটাবেস:
 * - Upstash Redis-এর env ভ্যারিয়েবল থাকলে (Vercel-এ) ডেটা Redis-এ থাকে।
 * - না থাকলে (নিজের কম্পিউটারে) আগের মতো data/db.json ফাইলে থাকে।
 */

export type Severity = "info" | "warning" | "danger";

export type Price = {
  id: string;
  crop: string; // ফসলের নাম
  unit: string; // কেজি / মণ / হালি / ...
  price: number; // টাকা
  market: string; // বাজারের নাম
  district: string;
  updatedAt: string;
  isSample?: boolean;
};

export type Advisory = {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  district: string; // "" = সারা দেশ
  active: boolean;
  createdAt: string;
};

export type Disease = {
  id: string;
  name: string;
  crop: string;
  symptoms: string;
  treatment: string;
  prevention: string;
  createdAt: string;
  isSample?: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  active: boolean;
  createdAt: string;
};

export type Settings = {
  siteName: string;
  tagline: string;
  helpline: string; // কৃষি কল সেন্টার
  helplineLabel: string;
  footerNote: string;
};

export type DB = {
  settings: Settings;
  prices: Price[];
  advisories: Advisory[];
  diseases: Disease[];
  announcements: Announcement[];
};

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Upstash Redis (Vercel Marketplace থেকে যোগ করলে এই env গুলো নিজে থেকে বসে)
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;
const REDIS_KEY = "krishoker:db";

export const newId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function seed(): DB {
  const t = now();
  const p = (crop: string, unit: string, price: number, market: string, district: string): Price => ({
    id: newId(), crop, unit, price, market, district, updatedAt: t, isSample: true,
  });
  return {
    settings: {
      siteName: "কৃষকের বন্ধু",
      tagline: "ফসলের ছবি দিন, রোগ চিনুন, সঠিক সমাধান জানুন",
      helpline: "16123",
      helplineLabel: "কৃষি কল সেন্টার",
      footerNote: "এই সাইটের তথ্য সহায়ক পরামর্শ মাত্র। কীটনাশক ব্যবহারের আগে লেবেল পড়ুন এবং স্থানীয় উপজেলা কৃষি অফিসারের সাথে কথা বলুন।",
    },
    prices: [
      p("পেঁয়াজ", "কেজি", 0, "কারওয়ান বাজার", "ঢাকা"),
      p("আলু", "কেজি", 0, "কারওয়ান বাজার", "ঢাকা"),
      p("টমেটো", "কেজি", 0, "কারওয়ান বাজার", "ঢাকা"),
      p("বেগুন", "কেজি", 0, "কারওয়ান বাজার", "ঢাকা"),
      p("মোটা ধান", "মণ", 0, "বগুড়া সদর", "বগুড়া"),
    ],
    advisories: [
      {
        id: newId(),
        title: "স্বাগতম! এটি একটি নমুনা পরামর্শ",
        body: "অ্যাডমিন প্যানেল থেকে এই পরামর্শ মুছে আপনার এলাকার আসল আবহাওয়া সতর্কতা দিন।",
        severity: "info",
        district: "",
        active: true,
        createdAt: t,
      },
    ],
    diseases: [
      {
        id: newId(), name: "ধানের ব্লাস্ট", crop: "ধান", isSample: true, createdAt: t,
        symptoms: "পাতায় চোখের মতো (মাঝখানে ধূসর, কিনারা বাদামি) দাগ। গিঁট বা শীষের গোড়া কালচে হয়ে ভেঙে যেতে পারে।",
        treatment: "আক্রান্ত হলে স্থানীয় কৃষি অফিসারের পরামর্শে অনুমোদিত ছত্রাকনাশক লেবেলের নিয়মে স্প্রে করুন। আক্রমণ বেশি হলে ইউরিয়া সার দেওয়া বন্ধ রাখুন।",
        prevention: "প্রতিরোধী জাত লাগান, সুষম সার দিন (অতিরিক্ত ইউরিয়া নয়), বীজ শোধন করুন, জমিতে আগাছা পরিষ্কার রাখুন।",
      },
      {
        id: newId(), name: "আলুর লেট ব্লাইট (বিলম্বিত ধ্বসা)", crop: "আলু", isSample: true, createdAt: t,
        symptoms: "পাতায় পানি-ভেজা কালচে দাগ, নিচে সাদা ছত্রাকের আস্তরণ। আর্দ্র ও কুয়াশাচ্ছন্ন আবহাওয়ায় দ্রুত ছড়ায়, পুরো গাছ পচে যায়।",
        treatment: "আক্রান্ত গাছ তুলে ধ্বংস করুন। কৃষি অফিসারের পরামর্শমতো অনুমোদিত ছত্রাকনাশক লেবেলের নিয়মে স্প্রে করুন।",
        prevention: "রোগমুক্ত বীজ আলু, কুয়াশার সময় আগেভাগে সতর্কতা, জমিতে পানি জমতে না দেওয়া, ফসল পর্যায়ক্রম।",
      },
      {
        id: newId(), name: "টমেটোর পাতা কোঁকড়ানো ভাইরাস", crop: "টমেটো", isSample: true, createdAt: t,
        symptoms: "পাতা কুঁকড়ে উপরের দিকে মুড়ে যায়, গাছ বেঁটে হয়, ফুল ও ফল কম ধরে। সাদা মাছি এই ভাইরাস ছড়ায়।",
        treatment: "আক্রান্ত গাছ তুলে মাটিতে পুঁতে ফেলুন। সাদা মাছি দমনে কৃষি অফিসারের পরামর্শে ব্যবস্থা নিন।",
        prevention: "চারা নেট বা মশারির ভেতরে তৈরি করুন, হলুদ আঠালো ফাঁদ ব্যবহার করুন, জমির আশপাশের আগাছা পরিষ্কার রাখুন।",
      },
    ],
    announcements: [],
  };
}

let seeding: Promise<DB> | null = null;

async function ensure(): Promise<DB> {
  // ---- Redis (Vercel) ----
  if (redis) {
    const existing = await redis.get<DB>(REDIS_KEY);
    if (existing) return existing;
    // প্রথমবার: নমুনা ডেটা বসান (nx = আগে থেকে থাকলে ওভাররাইট করবে না)
    await redis.set(REDIS_KEY, seed(), { nx: true });
    const created = await redis.get<DB>(REDIS_KEY);
    if (!created) throw new Error("Redis থেকে ডেটা পড়া যায়নি");
    return created;
  }

  // Vercel-এ Redis ছাড়া ফাইলে লেখা যায় না — পরিষ্কার এরর দেখান
  if (process.env.VERCEL) {
    throw new Error(
      "ডাটাবেস সেট করা নেই: Vercel-এ Upstash Redis যোগ করুন (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)।"
    );
  }

  // ---- লোকাল ফাইল ----
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as DB;
  } catch (e) {
    // ফাইল নষ্ট হলে (JSON ভুল) নতুন করে লিখে ডেটা মুছে ফেলা হবে না — এরর দেখাবে
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    // একসাথে কয়েকটি রিকোয়েস্ট এলেও নমুনা ডেটা মাত্র একবার তৈরি হয়
    seeding ??= (async () => {
      const db = seed();
      await write(db);
      return db;
    })().finally(() => {
      seeding = null;
    });
    return seeding;
  }
}

async function write(db: DB) {
  if (redis) {
    await redis.set(REDIS_KEY, db);
    return;
  }
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = DB_PATH + "." + crypto.randomUUID() + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH); // atomic replace
}

export async function getDB(): Promise<DB> {
  noStore(); // পেজ যেন বিল্ডের সময় স্ট্যাটিক হয়ে না যায়
  return ensure();
}

let queue: Promise<unknown> = Promise.resolve();

/** Run a change on the DB; changes are applied one at a time. */
export function updateDB(fn: (db: DB) => void): Promise<void> {
  const job = queue.then(async () => {
    const db = await ensure();
    fn(db);
    await write(db);
  });
  queue = job.catch(() => undefined);
  return job;
}