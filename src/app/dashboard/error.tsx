"use client";

import { useEffect } from "react";

export default function ErrorDashboard({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="font-display text-lg text-paper-100">Terjadi kesalahan</p>
      <p className="max-w-md text-sm text-paper-300">
        {error.message || "Ada yang tidak beres saat memuat halaman ini. Coba muat ulang."}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-signal-500 px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.1em] text-ink-950 hover:bg-signal-400"
      >
        Coba Lagi
      </button>
    </div>
  );
}
