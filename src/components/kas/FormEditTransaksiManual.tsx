"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTransaksiManual } from "@/lib/actions/kas";

export function FormEditTransaksiManual({
  id_transaksi,
  nominalAwal,
  keteranganAwal,
  daftarAnggota,
}: {
  id_transaksi: string;
  nominalAwal: number;
  keteranganAwal: string | null;
  daftarAnggota: Array<{ id_user: string; nim: string; nama_lengkap: string }>;
}) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [nominal, setNominal] = useState(nominalAwal);
  const [keterangan, setKeterangan] = useState(keteranganAwal ?? "");
  const [idUser, setIdUser] = useState("");
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
    <div className="space-y-1.5">
      <select
        value={idUser}
        onChange={(e) => setIdUser(e.target.value)}
        className="w-full rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-paper-100 outline-none focus:border-signal-500"
      >
        <option value="">Ganti siapa yang bayar (opsional)</option>
        {daftarAnggota.map((a) => (
          <option key={a.id_user} value={a.id_user}>
            {a.nama_lengkap} ({a.nim})
          </option>
        ))}
      </select>
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="number"
          value={nominal}
          onChange={(e) => setNominal(Number(e.target.value))}
          className="w-28 rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-paper-100 outline-none focus:border-signal-500"
        />
        <input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Keterangan"
          className="w-32 rounded border border-ink-600 bg-ink-900 px-2 py-1 text-xs text-paper-100 outline-none focus:border-signal-500"
        />
        {error && <p className="w-full text-xs text-danger-500">{error}</p>}
        <button
          disabled={pending}
          onClick={() => {
            const fd = new FormData();
            fd.set("id_transaksi", id_transaksi);
            fd.set("nominal", String(nominal));
            fd.set("keterangan", keterangan);
            if (idUser) fd.set("id_user", idUser);
            startTransition(async () => {
              const hasil = await updateTransaksiManual(fd);
              if (!hasil.sukses) setError(hasil.pesan);
              else {
                setTerbuka(false);
                router.refresh();
              }
            });
          }}
          className="rounded bg-signal-500 px-2.5 py-1 text-[10px] uppercase text-ink-950"
        >
          {pending ? "..." : "Simpan"}
        </button>
        <button onClick={() => setTerbuka(false)} className="text-xs text-paper-300">
          Batal
        </button>
      </div>
    </div>
  );
}
