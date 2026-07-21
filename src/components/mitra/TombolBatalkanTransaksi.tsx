"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { batalkanTransaksi } from "@/lib/actions/danus";

export function TombolBatalkanTransaksi({ id_penjualan }: { id_penjualan: string }) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [pending, startTransition] = useTransition();

  if (!terbuka) {
    return (
      <button onClick={() => setTerbuka(true)} className="text-xs text-danger-500 hover:underline">
        Batalkan
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={alasan}
        onChange={(e) => setAlasan(e.target.value)}
        placeholder="Alasan..."
        className="w-32 rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-paper-100 outline-none focus:border-signal-500"
        autoFocus
      />
      <button
        disabled={pending || !alasan}
        onClick={() =>
          startTransition(async () => {
            await batalkanTransaksi(id_penjualan, alasan);
            router.refresh();
          })
        }
        className="rounded border border-danger-500/50 bg-danger-500/10 px-2 py-1 text-[10px] uppercase text-danger-500"
      >
        Konfirmasi
      </button>
    </div>
  );
}
