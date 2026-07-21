"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusUser } from "@/lib/actions/pengguna";

export function TombolHapusUser({ id_user }: { id_user: string }) {
  const router = useRouter();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!konfirmasi) {
    return (
      <button
        onClick={() => setKonfirmasi(true)}
        className="rounded-md border border-danger-500/50 bg-danger-500/10 px-4 py-2 font-display text-[12px] uppercase tracking-[0.08em] text-danger-500 hover:bg-danger-500/20"
      >
        Hapus Akun Ini
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-danger-500/40 bg-danger-500/10 p-4">
      <p className="text-sm text-paper-100">Yakin hapus akun ini? Aksi ini permanen.</p>
      {error && <p className="text-sm text-danger-500">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const hasil = await hapusUser(id_user);
              if (!hasil.sukses) setError(hasil.pesan);
              else router.push("/dashboard/pengguna");
            })
          }
          className="rounded-md bg-danger-500 px-4 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-ink-950"
        >
          {pending ? "Menghapus..." : "Ya, Hapus"}
        </button>
        <button
          onClick={() => setKonfirmasi(false)}
          className="rounded-md border border-ink-600 px-4 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-paper-300"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
