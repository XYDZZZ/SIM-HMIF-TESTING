"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { tambahDokumenProker } from "@/lib/actions/proker";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };
const jenisDokumenOpsi = ["Proposal", "Surat", "LPJ", "Dokumentasi", "Lainnya"];

export function FormTambahDokumen({ id_proker }: { id_proker: string }) {
  const [terbuka, setTerbuka] = useState(false);
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await tambahDokumenProker(formData);
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
        + Tambah Dokumen
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-ink-700 bg-ink-900/60 p-4">
      <input type="hidden" name="id_proker" value={id_proker} />
      <Field label="Nama Dokumen" name="nama_dokumen" required />
      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Jenis
        </span>
        <select
          name="jenis_dokumen"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          {jenisDokumenOpsi.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
      </label>
      <Field label="URL Google Drive" name="url_dokumen" type="url" required placeholder="https://drive.google.com/..." />
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
