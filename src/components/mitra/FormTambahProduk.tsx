"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { buatProduk } from "@/lib/actions/danus";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormTambahProduk() {
  const [terbuka, setTerbuka] = useState(false);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await buatProduk(formData);
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
      <Button onClick={() => setTerbuka(true)} className="w-auto px-5">
        + Produk Baru
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-ink-700 bg-ink-900/60 p-6">
      <Field label="Nama Produk" name="nama_item" required autoFocus placeholder="Cetak Hitam Putih (per lembar)" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Harga Jual (Rp)" name="harga_jual" type="number" required />
        <Field label="% Margin HMIF" name="persentase_margin_himatif" type="number" step="0.5" required />
      </div>
      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="w-auto px-5">
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setTerbuka(false)} className="w-auto px-5">
          Batal
        </Button>
      </div>
    </form>
  );
}
