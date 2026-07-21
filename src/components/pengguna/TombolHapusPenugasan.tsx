"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusPenugasanPeriode } from "@/lib/actions/pengguna";

export function TombolHapusPenugasan({ id_anggota_periode }: { id_anggota_periode: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await hapusPenugasanPeriode(id_anggota_periode);
          router.refresh();
        })
      }
      className="text-xs text-danger-500 hover:underline"
    >
      {pending ? "Menghapus..." : "Hapus penugasan ini"}
    </button>
  );
}
