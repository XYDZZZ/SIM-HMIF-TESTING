"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusPanitia } from "@/lib/actions/proker";

export function TombolHapusPanitia({ id_panitia, id_proker }: { id_panitia: string; id_proker: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await hapusPanitia(id_panitia, id_proker);
          router.refresh();
        })
      }
      className="text-xs text-danger-500 hover:underline"
    >
      Hapus
    </button>
  );
}
