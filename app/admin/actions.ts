"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { newId, updateDB, type Severity } from "@/lib/db";

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const refresh = () => revalidatePath("/", "layout");
const nowIso = () => new Date().toISOString();

/* ---------- লগইন / লগআউট ---------- */

export async function login(f: FormData) {
  if (!checkPassword(String(f.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 900)); // ভুল পাসওয়ার্ড বারবার চেষ্টা ধীর করে
    redirect("/admin/login?error=1");
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ---------- বাজার দর ---------- */

export async function savePrice(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const crop = str(f, "crop", 60);
  const price = Number(str(f, "price", 12));
  if (!crop || !Number.isFinite(price) || price < 0) return;
  const rec = {
    crop,
    unit: str(f, "unit", 20) || "কেজি",
    price,
    market: str(f, "market", 60),
    district: str(f, "district", 40),
    updatedAt: nowIso(),
    isSample: false,
  };
  await updateDB((db) => {
    const i = db.prices.findIndex((p) => p.id === id);
    if (i >= 0) db.prices[i] = { ...db.prices[i], ...rec };
    else db.prices.push({ id: newId(), ...rec });
  });
  refresh();
}

export async function deletePrice(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  await updateDB((db) => {
    db.prices = db.prices.filter((p) => p.id !== id);
  });
  refresh();
}

/** প্রতি লাইনে: ফসল,একক,দাম,বাজার,জেলা */
export async function importPrices(f: FormData) {
  await requireAdmin();
  const lines = str(f, "rows", 20000).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 300);
  const t = nowIso();
  const items = lines.flatMap((l) => {
    const [crop, unit, price, market, district] = l.split(",").map((x) => x.trim());
    const p = Number(price);
    if (!crop || !Number.isFinite(p) || p < 0) return [];
    return [{ id: newId(), crop: crop.slice(0, 60), unit: (unit || "কেজি").slice(0, 20), price: p, market: (market || "").slice(0, 60), district: (district || "").slice(0, 40), updatedAt: t, isSample: false }];
  });
  if (items.length === 0) return;
  await updateDB((db) => {
    db.prices.push(...items);
  });
  refresh();
}

/** নমুনা দাম একসাথে মুছুন */
export async function clearSamplePrices() {
  await requireAdmin();
  await updateDB((db) => {
    db.prices = db.prices.filter((p) => !p.isSample);
  });
  refresh();
}

/* ---------- আবহাওয়া পরামর্শ ---------- */

export async function saveAdvisory(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const title = str(f, "title", 120);
  const body = str(f, "body", 1500);
  if (!title || !body) return;
  const sev = str(f, "severity") as Severity;
  const rec = {
    title,
    body,
    severity: (["info", "warning", "danger"].includes(sev) ? sev : "info") as Severity,
    district: str(f, "district", 40),
    active: f.get("active") === "on",
  };
  await updateDB((db) => {
    const i = db.advisories.findIndex((a) => a.id === id);
    if (i >= 0) db.advisories[i] = { ...db.advisories[i], ...rec };
    else db.advisories.unshift({ id: newId(), createdAt: nowIso(), ...rec });
  });
  refresh();
}

export async function deleteAdvisory(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  await updateDB((db) => {
    db.advisories = db.advisories.filter((a) => a.id !== id);
  });
  refresh();
}

/* ---------- রোগ-পোকার তথ্য ---------- */

export async function saveDisease(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name", 120);
  const crop = str(f, "crop", 60);
  if (!name || !crop) return;
  const rec = {
    name,
    crop,
    symptoms: str(f, "symptoms"),
    treatment: str(f, "treatment"),
    prevention: str(f, "prevention"),
    isSample: false,
  };
  await updateDB((db) => {
    const i = db.diseases.findIndex((d) => d.id === id);
    if (i >= 0) db.diseases[i] = { ...db.diseases[i], ...rec };
    else db.diseases.unshift({ id: newId(), createdAt: nowIso(), ...rec });
  });
  refresh();
}

export async function deleteDisease(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  await updateDB((db) => {
    db.diseases = db.diseases.filter((d) => d.id !== id);
  });
  refresh();
}

/* ---------- ঘোষণা ---------- */

export async function saveAnnouncement(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  const title = str(f, "title", 120);
  const body = str(f, "body", 1500);
  if (!title) return;
  const rec = { title, body, active: f.get("active") === "on" };
  await updateDB((db) => {
    const i = db.announcements.findIndex((a) => a.id === id);
    if (i >= 0) db.announcements[i] = { ...db.announcements[i], ...rec };
    else db.announcements.unshift({ id: newId(), createdAt: nowIso(), ...rec });
  });
  refresh();
}

export async function deleteAnnouncement(f: FormData) {
  await requireAdmin();
  const id = str(f, "id");
  await updateDB((db) => {
    db.announcements = db.announcements.filter((a) => a.id !== id);
  });
  refresh();
}

/* ---------- সাইট সেটিংস ---------- */

export async function saveSettings(f: FormData) {
  await requireAdmin();
  await updateDB((db) => {
    db.settings = {
      siteName: str(f, "siteName", 60) || db.settings.siteName,
      tagline: str(f, "tagline", 200),
      helpline: str(f, "helpline", 30),
      helplineLabel: str(f, "helplineLabel", 60),
      footerNote: str(f, "footerNote", 500),
    };
  });
  refresh();
}
