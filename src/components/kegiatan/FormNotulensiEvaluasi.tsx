"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { simpanNotulensiEvaluasi } from "@/lib/actions/kegiatan";
import type { HasilAksi } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormNotulensiEvaluasi({
  id_kegiatan,
  notulensiAwal,
  evaluasiAwal,
}: {
  id_kegiatan: string;
  notulensiAwal: string | null;
  evaluasiAwal: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await simpanNotulensiEvaluasi(formData);
      if (hasil.sukses) router.refresh();
      return hasil;
    },
    stateAwal
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_kegiatan" value={id_kegiatan} />

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Notulensi
        </span>
        <textarea
          name="notulensi"
          rows={4}
          defaultValue={notulensiAwal ?? ""}
          placeholder="Poin-poin pembahasan, keputusan yang diambil..."
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        />
      </label>

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Evaluasi
        </span>
        <textarea
          name="evaluasi"
          rows={3}
          defaultValue={evaluasiAwal ?? ""}
          placeholder="Apa yang perlu diperbaiki untuk kegiatan berikutnya..."
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        />
      </label>

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
