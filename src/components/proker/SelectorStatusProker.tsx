"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatusProker } from "@/lib/actions/proker";

const opsiStatus = ["Direncanakan", "Berjalan", "Selesai", "Dibatalkan"];

export function SelectorStatusProker({
  id_proker,
  statusSaatIni,
}: {
  id_proker: string;
  statusSaatIni: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        defaultValue={statusSaatIni}
        disabled={pending}
        onChange={(e) => {
          setError(null);
          startTransition(async () => {
            const hasil = await updateStatusProker(id_proker, e.target.value);
            if (!hasil.sukses) setError(hasil.pesan);
            else router.refresh();
          });
        }}
        className="rounded-md border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-paper-100 outline-none focus:border-signal-500"
      >
        {opsiStatus.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-danger-500">{error}</p>}
    </div>
  );
}
