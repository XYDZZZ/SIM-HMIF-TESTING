"use client";

import { useState } from "react";
import Link from "next/link";

interface ItemNav {
  href: string;
  label: string;
}

export function NavMobile({ items }: { items: ItemNav[] }) {
  const [terbuka, setTerbuka] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setTerbuka((v) => !v)}
        aria-label="Buka menu"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-600 text-paper-100"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {terbuka ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {terbuka && (
        <nav className="absolute left-0 right-0 top-full z-10 flex flex-col border-b border-ink-700 bg-ink-900 px-5 py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setTerbuka(false)}
              className="border-b border-ink-800 py-3 font-display text-[12px] uppercase tracking-[0.1em] text-paper-300 last:border-none hover:text-signal-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
