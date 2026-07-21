import { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

export function Field({ label, name, ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
        {label}
      </span>
      <input
        id={name}
        name={name}
        className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px]
                   text-paper-100 placeholder:text-ink-400 outline-none transition-colors
                   focus:border-signal-500 focus:ring-1 focus:ring-signal-500"
        {...rest}
      />
    </label>
  );
}
