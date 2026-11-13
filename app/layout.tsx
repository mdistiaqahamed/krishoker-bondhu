import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Nav from "@/components/Nav";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "কৃষকের বন্ধু",
  description: "ফসলের ছবি দিয়ে রোগ চিনুন, বাজার দর ও আবহাওয়ার খবর জানুন।",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f7d2c",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getDB();
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen pb-20 md:pb-0">
        <header className="sticky top-0 z-30 border-b border-leaf-100 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-leaf-700">
              <span className="text-2xl">🌾</span>
              {settings.siteName}
            </Link>
            <Nav />
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

        <footer className="border-t border-leaf-100 bg-white">
          <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-sm text-stone-600">
            <p>
              📞 {settings.helplineLabel}: <b className="text-leaf-700">{settings.helpline}</b>
            </p>
            <p>{settings.footerNote}</p>
            <p>
              <Link href="/admin" className="text-stone-400 hover:text-stone-600">
                অ্যাডমিন
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
