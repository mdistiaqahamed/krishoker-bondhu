"use client";

import { DISTRICT_NAMES } from "@/lib/districts";

export function Field({
  label,
  name,
  defaultValue,
  textarea,
  type = "text",
  required,
  placeholder,
  rows = 3,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  textarea?: boolean;
  type?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  step?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} required={required} placeholder={placeholder} rows={rows} className="input" />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} step={step} min={type === "number" ? 0 : undefined} className="input" />
      )}
    </div>
  );
}

export function DistrictSelect({
  name = "district",
  defaultValue = "",
  allLabel = "সব জেলা / সারা দেশ",
  label = "জেলা",
}: {
  name?: string;
  defaultValue?: string;
  allLabel?: string;
  label?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} defaultValue={defaultValue} className="input">
        <option value="">{allLabel}</option>
        {DISTRICT_NAMES.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}

/** মুছে ফেলার আগে নিশ্চিত করে */
export function DeleteButton({ action, message = "সত্যিই মুছে ফেলবেন?" }: { action: (f: FormData) => Promise<void>; message?: string }) {
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className="btn btn-danger"
    >
      🗑 মুছুন
    </button>
  );
}
