"use client";

import { InputHTMLAttributes, useState } from "react";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  name: string;
}

export function PasswordField({ label, name, ...rest }: PasswordFieldProps) {
  const [terlihat, setTerlihat] = useState(false);

  return (
    <label className="block">
      <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
        {label}
      </span>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={terlihat ? "text" : "password"}
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 pr-11 text-[15px]
                     text-paper-100 placeholder:text-ink-400 outline-none transition-colors
                     focus:border-signal-500 focus:ring-1 focus:ring-signal-500"
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setTerlihat((v) => !v)}
          aria-label={terlihat ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-300 hover:text-signal-400"
        >
          {terlihat ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}
