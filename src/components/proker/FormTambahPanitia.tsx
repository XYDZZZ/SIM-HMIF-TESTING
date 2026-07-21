"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { tambahPanitia } from "@/lib/actions/proker";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormTambahPanitia({
  id_proker,
  daftarAnggota,
}: {
  id_proker: string;
  daftarAnggota: Array<{ id_user: string; nama_lengkap: string; nim: string }>;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await tambahPanitia(formData);
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
      <Button variant="ghost" onClick={() => setTerbuka(true)} className="w-auto px-4 py-1.5 text-[11px]">
        + Tambah Panitia
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-ink-700 bg-ink-900/60 p-4">
      <input type="hidden" name="id_proker" value={id_proker} />

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
          {daftarAnggota.map((a) => (
            <option key={a.id_user} value={a.id_user}>
              {a.nama_lengkap} ({a.nim})
            </option>
          ))}
        </select>
      </label>

      <Field label="Peran" name="peran" required placeholder="Penanggung Jawab / Ketua Pelaksana / Sie Acara" />

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="w-auto px-4">
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setTerbuka(false)} className="w-auto px-4">
          Batal
        </Button>
      </div>
    </form>
  );
}
