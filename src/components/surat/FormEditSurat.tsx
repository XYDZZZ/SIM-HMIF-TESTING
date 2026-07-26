"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSurat } from "@/lib/actions/surat";

export function FormEditSurat({
  id_surat,
  nomorAwal,
  perihalAwal,
  tanggalAwal,
  asalTujuanAwal,
  urlDokumenAwal,
}: {
  id_surat: string;
  nomorAwal: string;
  perihalAwal: string;
  tanggalAwal: string;
  asalTujuanAwal: string | null;
  urlDokumenAwal: string | null;
}) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [nomor, setNomor] = useState(nomorAwal);
  const [perihal, setPerihal] = useState(perihalAwal);
  const [tanggal, setTanggal] = useState(tanggalAwal);
  const [asalTujuan, setAsalTujuan] = useState(asalTujuanAwal ?? "");
  const [urlDokumen, setUrlDokumen] = useState(urlDokumenAwal ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!terbuka) {
    return (
      <button onClick={() => setTerbuka(true)} className="text-xs text-signal-400 hover:underline">
        Edit
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-ink-700 bg-ink-900 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block font-display text-[10px] uppercase tracking-[0.1em] text-paper-300 mb-1">Nomor</span>
          <input
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
            className="w-full rounded border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm text-paper-100 outline-none focus:border-signal-500"
          />
        </label>
        <label className="block">
          <span className="block font-display text-[10px] uppercase tracking-[0.1em] text-paper-300 mb-1">Tanggal</span>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full rounded border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm text-paper-100 outline-none focus:border-signal-500"
          />
        </label>
      </div>
      <label className="block">
        <span className="block font-display text-[10px] uppercase tracking-[0.1em] text-paper-300 mb-1">Perihal</span>
        <input
          value={perihal}
          onChange={(e) => setPerihal(e.target.value)}
          className="w-full rounded border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm text-paper-100 outline-none focus:border-signal-500"
        />
      </label>
      <label className="block">
        <span className="block font-display text-[10px] uppercase tracking-[0.1em] text-paper-300 mb-1">Dari/Kepada</span>
        <input
          value={asalTujuan}
          onChange={(e) => setAsalTujuan(e.target.value)}
          className="w-full rounded border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm text-paper-100 outline-none focus:border-signal-500"
        />
      </label>
      <label className="block">
        <span className="block font-display text-[10px] uppercase tracking-[0.1em] text-paper-300 mb-1">URL Dokumen</span>
        <input
          value={urlDokumen}
          onChange={(e) => setUrlDokumen(e.target.value)}
          className="w-full rounded border border-ink-600 bg-ink-900 px-2.5 py-1.5 text-sm text-paper-100 outline-none focus:border-signal-500"
        />
      </label>

      {error && <p className="text-xs text-danger-500">{error}</p>}

      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("id_surat", id_surat);
            fd.set("nomor_surat", nomor);
            fd.set("perihal", perihal);
            fd.set("tanggal_surat", tanggal);
            fd.set("asal_tujuan", asalTujuan);
            fd.set("url_dokumen", urlDokumen);
            startTransition(async () => {
              const hasil = await updateSurat(fd);
              if (!hasil.sukses) setError(hasil.pesan);
              else {
                setTerbuka(false);
                router.refresh();
              }
            });
          }}
          className="rounded bg-signal-500 px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-ink-950"
        >
          {pending ? "..." : "Simpan"}
        </button>
        <button
          onClick={() => setTerbuka(false)}
          className="rounded border border-ink-600 px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] text-paper-300"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
