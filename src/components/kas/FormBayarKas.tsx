"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ajukanPembayaranKas } from "@/lib/actions/kas";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { FileField } from "@/components/ui/FileField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormBayarKas({
  daftarTagihan,
}: {
  daftarTagihan: Array<{ id_tagihan: string; nama_tagihan: string; nominal: number }>;
}) {
  const router = useRouter();
  const [kategori, setKategori] = useState<"Kas Rutin" | "Kas Tagihan Khusus">("Kas Rutin");

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await ajukanPembayaranKas(formData);
      if (hasil.sukses) router.push("/dashboard/kas");
      return hasil;
    },
    stateAwal
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Jenis Pembayaran
        </span>
        <select
          name="kategori"
          value={kategori}
          onChange={(e) => setKategori(e.target.value as "Kas Rutin" | "Kas Tagihan Khusus")}
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          <option value="Kas Rutin">Kas Rutin</option>
          <option value="Kas Tagihan Khusus">Tagihan Khusus</option>
        </select>
      </label>

      {kategori === "Kas Tagihan Khusus" && (
        <label className="block">
          <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
            Pilih Tagihan
          </span>
          <select
            name="id_tagihan"
            required
            className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
          >
            <option value="">-- pilih --</option>
            {daftarTagihan.map((t) => (
              <option key={t.id_tagihan} value={t.id_tagihan}>
                {t.nama_tagihan} — Rp{Number(t.nominal).toLocaleString("id-ID")}
              </option>
            ))}
          </select>
        </label>
      )}

      <Field label="Nominal (Rp)" name="nominal" type="number" required />
      <FileField label="Bukti Transfer" name="bukti_file" required />

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Mengirim..." : "Ajukan Pembayaran"}
      </Button>
    </form>
  );
}
