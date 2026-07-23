"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusProker } from "@/lib/actions/proker";

export function TombolHapusProker({ id_proker }: { id_proker: string }) {
  const router = useRouter();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!konfirmasi) {
    return (
      <button
        onClick={() => setKonfirmasi(true)}
        className="rounded-md border border-danger-500/50 bg-danger-500/10 px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-danger-500 hover:bg-danger-500/20"
      >
        Hapus Proker
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-xs text-danger-500">{error}</p>}
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const hasil = await hapusProker(id_proker);
            if (!hasil.sukses) setError(hasil.pesan);
            else router.push("/dashboard/proker");
          })
        }
        className="rounded-md bg-danger-500 px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-ink-950"
      >
        {pending ? "Menghapus..." : "Yakin, Hapus"}
      </button>
      <button
        onClick={() => setKonfirmasi(false)}
        className="rounded-md border border-ink-600 px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-paper-300"
      >
        Batal
      </button>
    </div>
  );
}
