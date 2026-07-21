"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ubahBobotPoin } from "@/lib/actions/kegiatan";

export function EditorBobotPoin({ id_kegiatan, bobotAwal }: { id_kegiatan: string; bobotAwal: number }) {
  const router = useRouter();
  const [nilai, setNilai] = useState(bobotAwal);
  const [pending, startTransition] = useTransition();
  const [tersimpan, setTersimpan] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="0.5"
        value={nilai}
        onChange={(e) => {
          setNilai(Number(e.target.value));
          setTersimpan(false);
        }}
        className="w-20 rounded-md border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm text-paper-100 outline-none focus:border-signal-500"
      />
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await ubahBobotPoin(id_kegiatan, nilai);
            setTersimpan(true);
            router.refresh();
          })
        }
        className="rounded-md border border-ink-600 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-paper-300 hover:border-signal-500 hover:text-signal-400"
      >
        {pending ? "..." : tersimpan ? "Tersimpan" : "Simpan"}
      </button>
    </div>
  );
}
