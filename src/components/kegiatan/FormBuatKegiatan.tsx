"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { buatKegiatan } from "@/lib/actions/kegiatan";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormBuatKegiatan({
  id_periode,
  daftarProker,
}: {
  id_periode: string;
  daftarProker: Array<{ id_proker: string; nama_proker: string }>;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await buatKegiatan(formData);
      if (hasil.sukses) router.push("/dashboard/kegiatan");
      return hasil;
    },
    stateAwal
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_periode" value={id_periode} />

      <Field label="Nama Kegiatan" name="nama_kegiatan" required autoFocus placeholder="Rapat Mingguan PSDM" />

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Terkait Proker (opsional)
        </span>
        <select
          name="id_proker"
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          <option value="">Rapat umum / tidak terikat proker</option>
          {daftarProker.map((p) => (
            <option key={p.id_proker} value={p.id_proker}>
              {p.nama_proker}
            </option>
          ))}
        </select>
      </label>

      <Field label="Waktu Mulai" name="waktu_mulai" type="datetime-local" required />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Toleransi Telat (menit)" name="toleransi_menit" type="number" defaultValue={15} required />
        <Field label="Bobot Poin" name="bobot_poin" type="number" step="0.5" defaultValue={1} required />
      </div>

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Buat Kegiatan"}
      </Button>
    </form>
  );
}
