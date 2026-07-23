"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { catatSurat, nomorSuratBerikutnya } from "@/lib/actions/surat";
import { KODE_JENIS_SURAT } from "@/lib/constants/surat";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormCatatSurat({ id_periode }: { id_periode: string }) {
  const router = useRouter();
  const [jenis, setJenis] = useState<"Masuk" | "Keluar">("Keluar");
  const [kategoriPenerbit, setKategoriPenerbit] = useState<"Kepengurusan" | "Kepanitiaan">("Kepengurusan");
  const [kodeJenisSurat, setKodeJenisSurat] = useState<string>(KODE_JENIS_SURAT[0].kode);
  const [kodeKegiatan, setKodeKegiatan] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [mengambilSaran, setMengambilSaran] = useState(false);
  const [errorSaran, setErrorSaran] = useState<string | null>(null);

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
    setErrorSaran(null);
    setMengambilSaran(true);
    const hasil = await nomorSuratBerikutnya(id_periode, kategoriPenerbit, kodeJenisSurat, kodeKegiatan);
    setMengambilSaran(false);
    if (hasil.sukses) setNomorSurat(hasil.nomor);
    else setErrorSaran(hasil.pesan);
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

      {jenis === "Keluar" && (
        <>
          <label className="block">
            <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
              Kategori Penerbit
            </span>
            <select
              name="kategori_penerbit"
              value={kategoriPenerbit}
              onChange={(e) => setKategoriPenerbit(e.target.value as "Kepengurusan" | "Kepanitiaan")}
              className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
            >
              <option value="Kepengurusan">Kepengurusan (dari Pengurus HMIF)</option>
              <option value="Kepanitiaan">Kepanitiaan (dari Panitia Pelaksana)</option>
            </select>
          </label>

          <label className="block">
            <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
              Kode Jenis Surat
            </span>
            <select
              name="kode_jenis_surat"
              value={kodeJenisSurat}
              onChange={(e) => setKodeJenisSurat(e.target.value)}
              className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
            >
              {KODE_JENIS_SURAT.map((k) => (
                <option key={k.kode} value={k.kode}>
                  {k.kode} — {k.label}
                </option>
              ))}
            </select>
          </label>

          {kategoriPenerbit === "Kepanitiaan" && (
            <Field
              label="Kode Kegiatan"
              name="kode_kegiatan"
              required
              placeholder="MUBES"
              value={kodeKegiatan}
              onChange={(e) => setKodeKegiatan(e.target.value.toUpperCase())}
            />
          )}
        </>
      )}

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
            placeholder={jenis === "Masuk" ? "Nomor sesuai surat asli dari pengirim" : "001/UND/HMIF-UNPERBA/VIII/2026"}
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
        {errorSaran && <p className="mt-1 text-xs text-danger-500">{errorSaran}</p>}
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
