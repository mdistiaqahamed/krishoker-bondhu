import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/admin", label: "ড্যাশবোর্ড" },
  { href: "/admin/prices", label: "বাজার দর" },
  { href: "/admin/advisories", label: "আবহাওয়া পরামর্শ" },
  { href: "/admin/diseases", label: "রোগ-পোকা" },
  { href: "/admin/announcements", label: "ঘোষণা" },
  { href: "/admin/settings", label: "সেটিংস" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <span className="mr-2 font-bold text-leaf-700">⚙️ অ্যাডমিন</span>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-leaf-100">
            {l.label}
          </Link>
        ))}
        <form action={logout} className="ml-auto">
          <button className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">লগআউট</button>
        </form>
      </div>
      {children}
    </div>
  );
}
