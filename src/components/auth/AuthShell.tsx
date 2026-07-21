import { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-dot-grid flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-signal-500 shadow-[0_0_8px_2px_rgba(232,163,61,0.5)]" />
          <span className="font-display text-[12px] uppercase tracking-[0.2em] text-paper-300">
            SIM · HIMATIF
          </span>
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-900/80 backdrop-blur-sm p-7 sm:p-8">
          <h1 className="font-display text-xl text-paper-100 mb-1.5">{title}</h1>
          <p className="text-sm text-paper-300 mb-6">{subtitle}</p>
          {children}
        </div>

        <div className="rule-signal mt-6 mb-3" />
        <p className="text-center font-display text-[10px] uppercase tracking-[0.15em] text-ink-400">
          Sistem Informasi Manajemen · Himpunan Mahasiswa Informatika
        </p>
      </div>
    </div>
  );
}
