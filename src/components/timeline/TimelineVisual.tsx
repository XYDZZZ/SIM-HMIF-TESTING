"use client";

import { useState } from "react";
import Link from "next/link";

export interface ItemTimeline {
  id: string;
  judul: string;
  subjudul?: string;
  status: string;
  tanggal_mulai: string | null;
  tanggal_selesai?: string | null;
  href: string;
}

const warnaTitikMap: Record<string, string> = {
  Direncanakan: "bg-ink-400 border-ink-400",
  Berjalan: "bg-signal-500 border-signal-500 shadow-[0_0_10px_2px_rgba(232,163,61,0.5)]",
  Selesai: "bg-ok-500 border-ok-500",
  Dibatalkan: "bg-danger-500 border-danger-500",
};

const warnaTeksMap: Record<string, string> = {
  Direncanakan: "text-paper-300",
  Berjalan: "text-signal-400",
  Selesai: "text-ok-500",
  Dibatalkan: "text-danger-500",
};

function warnaTitik(status: string) {
  return warnaTitikMap[status] ?? "bg-ink-400 border-ink-400";
}
function warnaTeks(status: string) {
  return warnaTeksMap[status] ?? "text-paper-300";
}

function DetailItem({ item }: { item: ItemTimeline }) {
  return (
    <Link
      href={item.href}
      className="block rounded-lg border border-ink-700 bg-ink-900 p-4 transition-colors hover:border-signal-500/50"
    >
      <p className="text-sm text-paper-100">{item.judul}</p>
      {item.subjudul && <p className="mt-0.5 text-xs text-paper-300">{item.subjudul}</p>}
      <p className="mt-1 text-xs text-paper-300">
        {item.tanggal_mulai ?? "Tanggal belum diatur"}
        {item.tanggal_selesai && ` s/d ${item.tanggal_selesai}`}
      </p>
      <p className={`mt-1 font-display text-[11px] uppercase tracking-[0.08em] ${warnaTeks(item.status)}`}>
        {item.status}
      </p>
    </Link>
  );
}

export function TimelineVisual({ items }: { items: ItemTimeline[] }) {
  const [orientasi, setOrientasi] = useState<"vertical" | "horizontal">("vertical");
  const [terpilih, setTerpilih] = useState<string | null>(null);

  const terurut = [...items].sort((a, b) => {
    if (!a.tanggal_mulai) return 1;
    if (!b.tanggal_mulai) return -1;
    return a.tanggal_mulai.localeCompare(b.tanggal_mulai);
  });

  if (terurut.length === 0) {
    return <p className="text-sm text-paper-300">Belum ada data untuk ditampilkan.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["vertical", "horizontal"] as const).map((o) => (
          <button
            key={o}
            onClick={() => {
              setOrientasi(o);
              setTerpilih(null);
            }}
            className={`rounded-md border px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] ${
              orientasi === o
                ? "border-signal-500 bg-signal-500/10 text-signal-400"
                : "border-ink-600 text-paper-300 hover:text-paper-100"
            }`}
          >
            {o === "vertical" ? "Vertikal" : "Horizontal"}
          </button>
        ))}
      </div>

      {orientasi === "vertical" ? (
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-ink-600" />
          <div className="space-y-3">
            {terurut.map((item) => (
              <div key={item.id} className="relative">
                <span
                  className={`absolute -left-8 top-1.5 h-3.5 w-3.5 rounded-full border-2 ${warnaTitik(item.status)}`}
                />
                <button
                  onClick={() => setTerpilih(terpilih === item.id ? null : item.id)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-900/60 p-4 text-left transition-colors hover:border-signal-500/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-paper-100">{item.judul}</p>
                    <span className={`font-display text-[10px] uppercase tracking-[0.08em] ${warnaTeks(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-paper-300">
                    {item.subjudul}
                    {item.subjudul && item.tanggal_mulai && " · "}
                    {item.tanggal_mulai}
                    {item.tanggal_selesai && ` s/d ${item.tanggal_selesai}`}
                  </p>
                </button>

                {terpilih === item.id && (
                  <div className="mt-2 pl-1">
                    <Link
                      href={item.href}
                      className="inline-block rounded-md border border-signal-500/40 bg-signal-500/10 px-4 py-2 text-xs text-signal-400 hover:bg-signal-500/20"
                    >
                      Buka detail lengkap &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="overflow-x-auto pb-3">
            <div className="relative flex min-w-max items-start gap-10 px-2 pt-6">
              <div className="absolute left-2 right-2 top-[34px] h-px bg-ink-600" />
              {terurut.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTerpilih(terpilih === item.id ? null : item.id)}
                  className="relative flex w-36 flex-col items-center text-center"
                >
                  <span
                    className={`z-10 h-4 w-4 rounded-full border-2 ${warnaTitik(item.status)} ${
                      terpilih === item.id ? "ring-2 ring-signal-400 ring-offset-2 ring-offset-ink-950" : ""
                    }`}
                  />
                  <p className="mt-3 line-clamp-2 text-xs text-paper-100">{item.judul}</p>
                  <p className="mt-1 text-[10px] text-paper-300">{item.tanggal_mulai ?? "-"}</p>
                </button>
              ))}
            </div>
          </div>

          {terpilih && <DetailItem item={terurut.find((i) => i.id === terpilih)!} />}
          {!terpilih && <p className="text-xs text-paper-300">Klik salah satu titik untuk lihat detail.</p>}
        </div>
      )}
    </div>
  );
}
