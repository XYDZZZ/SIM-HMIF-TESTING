"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tambahStokMasuk } from "@/lib/actions/danus";

export function TombolRestock({ id_barang }: { id_barang: string }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [jumlah, setJumlah] = useState(0);
  const [pending, startTransition] = useTransition();

  if (!terbuka) {
    return (
      <button
        onClick={() => setTerbuka(true)}
        className="rounded border border-ink-600 px-2.5 py-1 font-display text-[10px] uppercase tracking-[0.08em] text-paper-300 hover:border-signal-500 hover:text-signal-400"
      >
        Restock
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={jumlah}
        onChange={(e) => setJumlah(Number(e.target.value))}
        className="w-16 rounded border border-ink-600 bg-ink-900 px-2 py-1 text-sm text-paper-100 outline-none focus:border-signal-500"
        autoFocus
      />
      <button
        disabled={pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("id_barang", id_barang);
          fd.set("jumlah", String(jumlah));
          startTransition(async () => {
            await tambahStokMasuk(fd);
            setTerbuka(false);
            setJumlah(0);
            router.refresh();
          });
        }}
        className="rounded bg-signal-500 px-2.5 py-1 font-display text-[10px] uppercase text-ink-950"
      >
        OK
      </button>
    </div>
  );
}
