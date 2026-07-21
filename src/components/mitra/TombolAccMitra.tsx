"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { accTolakMitra } from "@/lib/actions/mitra-auth";

export function TombolAccMitra({ id_mitra }: { id_mitra: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function aksi(keputusan: "Disetujui" | "Ditolak") {
    startTransition(async () => {
      await accTolakMitra(id_mitra, keputusan);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={() => aksi("Disetujui")}
        className="rounded-md border border-ok-500/50 bg-ok-500/10 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-ok-500 hover:bg-ok-500/20"
      >
        Setujui
      </button>
      <button
        disabled={pending}
        onClick={() => aksi("Ditolak")}
        className="rounded-md border border-danger-500/50 bg-danger-500/10 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-danger-500 hover:bg-danger-500/20"
      >
        Tolak
      </button>
    </div>
  );
}
