"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { simpanLPJ } from "@/lib/actions/proker";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormLPJ({
  id_proker,
  nilaiAwal,
}: {
  id_proker: string;
  nilaiAwal: {
    lpj_ringkasan: string | null;
    lpj_kendala: string | null;
    lpj_rekomendasi: string | null;
    lpj_url_dokumen: string | null;
  };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await simpanLPJ(formData);
      if (hasil.sukses) router.refresh();
      return hasil;
    },
    stateAwal
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_proker" value={id_proker} />

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Ringkasan Pelaksanaan
        </span>
        <textarea
          name="lpj_ringkasan"
          rows={3}
          defaultValue={nilaiAwal.lpj_ringkasan ?? ""}
          placeholder="Apa yang dikerjakan, kapan, siapa saja yang terlibat..."
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        />
      </label>

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Kendala
        </span>
        <textarea
          name="lpj_kendala"
          rows={2}
          defaultValue={nilaiAwal.lpj_kendala ?? ""}
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        />
      </label>

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Rekomendasi untuk Periode Berikutnya
        </span>
        <textarea
          name="lpj_rekomendasi"
          rows={2}
          defaultValue={nilaiAwal.lpj_rekomendasi ?? ""}
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        />
      </label>

      <Field
        label="URL Dokumen LPJ Lengkap (opsional)"
        name="lpj_url_dokumen"
        type="url"
        defaultValue={nilaiAwal.lpj_url_dokumen ?? ""}
      />

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Simpan LPJ"}
      </Button>
    </form>
  );
}
