"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ubahStatusProduk } from "@/lib/actions/danus";

export function TogglStatusProduk({ id_produk, status }: { id_produk: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await ubahStatusProduk(id_produk, status === "Aktif" ? "Nonaktif" : "Aktif");
          router.refresh();
        });
      }}
      className={`rounded border px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.1em] ${
        status === "Aktif" ? "border-ok-500/50 bg-ok-500/10 text-ok-500" : "border-ink-600 text-paper-300"
      }`}
    >
      {status}
    </button>
  );
}
