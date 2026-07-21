"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { catatSurat, nomorSuratBerikutnya } from "@/lib/actions/surat";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormCatatSurat({ id_periode }: { id_periode: string }) {
  const router = useRouter();
  const [jenis, setJenis] = useState<"Masuk" | "Keluar">("Keluar");
  const [nomorSurat, setNomorSurat] = useState("");
  const [mengambilSaran, setMengambilSaran] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await catatSurat(formData);
      if (hasil.sukses) {
        router.refresh();
        setNomorSurat("");
      }
      return hasil;
    },
    stateAwal
  );

  async function ambilSaranNomor() {
    setMengambilSaran(true);
    const saran = await nomorSuratBerikutnya(id_periode);
    setNomorSurat(saran);
    setMengambilSaran(false);
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_periode" value={id_periode} />

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Jenis
        </span>
        <select
          name="jenis"
          value={jenis}
          onChange={(e) => setJenis(e.target.value as "Masuk" | "Keluar")}
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          <option value="Keluar">Surat Keluar</option>
          <option value="Masuk">Surat Masuk</option>
        </select>
      </label>

      <div>
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Nomor Surat
        </span>
        <div className="flex gap-2">
          <input
            name="nomor_surat"
            value={nomorSurat}
            onChange={(e) => setNomorSurat(e.target.value)}
            required
            placeholder={jenis === "Masuk" ? "Nomor sesuai surat asli dari pengirim" : "001/HMIF/VII/2026"}
            className="flex-1 rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
          />
          {jenis === "Keluar" && (
            <button
              type="button"
              onClick={ambilSaranNomor}
              disabled={mengambilSaran}
              className="whitespace-nowrap rounded-md border border-ink-600 px-3 text-xs text-paper-300 hover:border-signal-500 hover:text-signal-400"
            >
              {mengambilSaran ? "..." : "Saran Nomor"}
            </button>
          )}
        </div>
      </div>

      <Field label="Perihal" name="perihal" required placeholder="Undangan Rapat Koordinasi" />
      <Field
        label={jenis === "Masuk" ? "Dari" : "Kepada"}
        name="asal_tujuan"
        placeholder={jenis === "Masuk" ? "BEM Fakultas" : "Ketua Prodi Informatika"}
      />
      <Field label="Tanggal Surat" name="tanggal_surat" type="date" required />
      <Field label="URL Dokumen (opsional)" name="url_dokumen" type="url" />

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Catat Surat"}
      </Button>
    </form>
  );
}
