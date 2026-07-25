"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { pulihkanProker } from "@/lib/actions/proker";

export function TombolPulihkanProker({ id_proker }: { id_proker: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await pulihkanProker(id_proker);
          router.refresh();
        })
      }
      className="rounded-md border border-ok-500/50 bg-ok-500/10 px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-ok-500 hover:bg-ok-500/20"
    >
      {pending ? "Memulihkan..." : "Pulihkan Proker"}
    </button>
  );
}
