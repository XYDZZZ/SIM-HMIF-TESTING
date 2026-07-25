"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { inputTunaiBendahara } from "@/lib/actions/kas";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormTunaiBendahara({
  daftarAnggota,
  daftarTagihan,
}: {
  daftarAnggota: Array<{ id_user: string; nim: string; nama_lengkap: string }>;
  daftarTagihan: Array<{ id_tagihan: string; nama_tagihan: string }>;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [kategori, setKategori] = useState<"Kas Rutin" | "Kas Tagihan Khusus">("Kas Rutin");
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await inputTunaiBendahara(formData);
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
        + Catat Pembayaran Tunai
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-ink-700 bg-ink-900/60 p-6">
      <p className="text-xs text-paper-300">
        Untuk anggota yang bayar cash langsung ke Bendahara (mis. saat rapat) — tidak perlu bukti transfer,
        langsung tercatat Lunas.
      </p>

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Anggota yang Bayar
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
                {t.nama_tagihan}
              </option>
            ))}
          </select>
        </label>
      )}

      <Field label="Nominal (Rp)" name="nominal" type="number" required />

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="w-auto px-5">
          {pending ? "Menyimpan..." : "Catat"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setTerbuka(false)} className="w-auto px-5">
          Batal
        </Button>
      </div>
    </form>
  );
}
