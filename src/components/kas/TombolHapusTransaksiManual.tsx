"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusTransaksiManual } from "@/lib/actions/kas";

export function TombolHapusTransaksiManual({ id_transaksi }: { id_transaksi: string }) {
  const router = useRouter();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!konfirmasi) {
    return (
      <button onClick={() => setKonfirmasi(true)} className="text-xs text-danger-500 hover:underline">
        Hapus
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await hapusTransaksiManual(id_transaksi);
            router.refresh();
          })
        }
        className="text-xs text-danger-500 underline"
      >
        {pending ? "..." : "Yakin?"}
      </button>
      <button onClick={() => setKonfirmasi(false)} className="text-xs text-paper-300">
        Batal
      </button>
    </span>
  );
}
