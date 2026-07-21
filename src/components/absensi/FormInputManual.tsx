"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { inputManualAbsensi } from "@/lib/actions/absensi";
import type { HasilAksi } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };
const opsiStatus = ["Tepat Waktu", "Terlambat", "Izin", "Sakit"];

export function FormInputManual({
  id_kegiatan,
  calonAnggota,
}: {
  id_kegiatan: string;
  calonAnggota: Array<{ id_user: string; nim: string; nama_lengkap: string }>;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await inputManualAbsensi(formData);
      if (hasil.sukses) router.refresh();
      return hasil;
    },
    stateAwal
  );

  if (calonAnggota.length === 0) {
    return <p className="text-sm text-paper-300">Semua anggota periode ini sudah tercatat.</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_kegiatan" value={id_kegiatan} />

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Anggota
        </span>
        <select
          name="id_user"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          <option value="">-- pilih --</option>
          {calonAnggota.map((a) => (
            <option key={a.id_user} value={a.id_user}>
              {a.nama_lengkap} ({a.nim})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Status
        </span>
        <select
          name="status_kehadiran"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          {opsiStatus.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Catatan (opsional, mis. alasan izin/sakit)
        </span>
        <input
          name="catatan"
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        />
      </label>

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Catat Absensi"}
      </Button>
    </form>
  );
}
