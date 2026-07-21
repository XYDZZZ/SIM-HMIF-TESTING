"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { buatTransaksi } from "@/lib/actions/danus";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormBuatTransaksi({
  produkAktif,
}: {
  produkAktif: Array<{ id_produk: string; nama_item: string; harga_jual: number }>;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await buatTransaksi(formData);
      if (hasil.sukses) router.refresh();
      return hasil;
    },
    stateAwal
  );

  if (produkAktif.length === 0) {
    return <p className="text-sm text-paper-300">Tambahkan produk aktif dulu di halaman Katalog.</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Produk
        </span>
        <select
          name="id_produk"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          {produkAktif.map((p) => (
            <option key={p.id_produk} value={p.id_produk}>
              {p.nama_item} — Rp{p.harga_jual.toLocaleString("id-ID")}
            </option>
          ))}
        </select>
      </label>

      <Field label="Kuantitas" name="kuantitas" type="number" min={1} defaultValue={1} required />

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Memproses..." : "Catat Transaksi"}
      </Button>
    </form>
  );
}
