"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "হোম", icon: "🏡" },
  { href: "/rog-chinun", label: "রোগ চিনুন", icon: "📷" },
  { href: "/bazar-dor", label: "বাজার দর", icon: "💰" },
  { href: "/abohaowa", label: "আবহাওয়া", icon: "⛅" },
  { href: "/rog-pokar-tothyo", label: "রোগ-পোকা", icon: "📖" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <>
      {/* ডেস্কটপ */}
      <nav className="hidden gap-1 md:flex">
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-4 py-2 font-semibold transition ${
                active ? "bg-leaf-600 text-white" : "text-leaf-900 hover:bg-leaf-100"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      {/* মোবাইল — নিচে স্থির ট্যাব বার */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-leaf-200 bg-white/95 backdrop-blur md:hidden">
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                active ? "text-leaf-700" : "text-stone-500"
              }`}
            >
              <span className="text-xl leading-none">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
