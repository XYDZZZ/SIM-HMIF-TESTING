"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { akhiriPeriodeBukaBaru } from "@/lib/actions/periode";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormPeriodeBaru({ adaPeriodeAktif }: { adaPeriodeAktif: boolean }) {
  const [terbuka, setTerbuka] = useState(false);
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await akhiriPeriodeBukaBaru(formData);
      if (hasil.sukses) {
        router.refresh();
        setTerbuka(false);
      }
      return hasil;
    },
    stateAwal
  );

  if (!terbuka) {
    return (
      <Button variant="ghost" onClick={() => setTerbuka(true)} className="w-auto px-5">
        {adaPeriodeAktif ? "Akhiri Periode & Buka Periode Baru" : "Buka Periode Pertama"}
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-signal-500/40 bg-ink-900/60 p-6">
      <p className="mb-4 font-display text-[11px] uppercase tracking-[0.12em] text-signal-400">
        {adaPeriodeAktif
          ? "Peringatan: periode berjalan akan dikunci permanen (baca-saja) setelah ini."
          : "Membuka periode kepengurusan pertama"}
      </p>
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama Periode" name="nama_periode" placeholder="2026/2027" required />
          <Field label="Tahun" name="tahun" type="number" placeholder="2026" required />
        </div>
        {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Memproses..." : "Konfirmasi"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setTerbuka(false)}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
