"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { simpanResepProduk } from "@/lib/actions/danus";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface Baris {
  id_barang: string;
  jumlah_pemakaian: number;
}

export function FormResepProduk({
  id_produk,
  daftarBahan,
  resepAwal,
}: {
  id_produk: string;
  daftarBahan: Array<{ id_barang: string; nama_bahan: string; satuan: string }>;
  resepAwal: Baris[];
}) {
  const router = useRouter();
  const [baris, setBaris] = useState<Baris[]>(resepAwal.length > 0 ? resepAwal : []);
  const [pending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null);

  function tambahBaris() {
    if (daftarBahan.length === 0) return;
    setBaris((prev) => [...prev, { id_barang: daftarBahan[0].id_barang, jumlah_pemakaian: 1 }]);
  }

  function hapusBaris(idx: number) {
    setBaris((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateBaris(idx: number, patch: Partial<Baris>) {
    setBaris((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  }

  function simpan() {
    startTransition(async () => {
      const hasil = await simpanResepProduk(id_produk, baris);
      setPesan({ sukses: hasil.sukses, teks: hasil.pesan });
      if (hasil.sukses) router.refresh();
    });
  }

  if (daftarBahan.length === 0) {
    return <p className="text-sm text-paper-300">Tambahkan bahan baku dulu di halaman Stok sebelum mengatur resep.</p>;
  }

  return (
    <div className="space-y-3">
      {baris.map((b, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <select
            value={b.id_barang}
            onChange={(e) => updateBaris(idx, { id_barang: e.target.value })}
            className="flex-1 rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-signal-500"
          >
            {daftarBahan.map((bh) => (
              <option key={bh.id_barang} value={bh.id_barang}>
                {bh.nama_bahan} ({bh.satuan})
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={b.jumlah_pemakaian}
            onChange={(e) => updateBaris(idx, { jumlah_pemakaian: Number(e.target.value) })}
            className="w-24 rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-signal-500"
          />
          <button onClick={() => hapusBaris(idx)} className="text-danger-500 hover:underline text-sm">
            Hapus
          </button>
        </div>
      ))}

      <button onClick={tambahBaris} className="text-sm text-signal-400 hover:underline">
        + Tambah Bahan
      </button>

      {pesan && <Alert sukses={pesan.sukses} pesan={pesan.teks} />}

      <Button onClick={simpan} disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Simpan Resep"}
      </Button>
    </div>
  );
}
