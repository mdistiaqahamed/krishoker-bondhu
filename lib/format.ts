const nf = new Intl.NumberFormat("bn-BD");

export const bn = (n: number | string) => (typeof n === "number" ? nf.format(n) : String(n));

export const taka = (n: number) => (n > 0 ? `৳ ${nf.format(n)}` : "—");

export const bnDate = (iso: string) =>
  new Date(iso).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });

export const SEVERITY_STYLE = {
  info: { label: "তথ্য", box: "border-sky-200 bg-sky-50 text-sky-900", dot: "bg-sky-500" },
  warning: { label: "সতর্কতা", box: "border-amber-300 bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  danger: { label: "জরুরি", box: "border-red-300 bg-red-50 text-red-900", dot: "bg-red-600" },
} as const;
