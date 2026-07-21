import Link from "next/link";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarTagihanKhusus } from "@/lib/actions/kas";
import { FormBayarKas } from "@/components/kas/FormBayarKas";

export default async function HalamanBayarKas() {
  const periodeAktif = await getPeriodeAktif();
  const tagihan = periodeAktif ? await daftarTagihanKhusus(periodeAktif.id_periode) : [];

  return (
    <div className="space-y-6">
      <Link href="/dashboard/kas" className="text-sm text-signal-400 hover:underline">
        &larr; Kas
      </Link>
      <h1 className="font-display text-2xl text-paper-100">Ajukan Pembayaran</h1>

      <div className="max-w-lg rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <FormBayarKas
          daftarTagihan={tagihan.map((t) => ({ id_tagihan: t.id_tagihan, nama_tagihan: t.nama_tagihan, nominal: Number(t.nominal) }))}
        />
      </div>
    </div>
  );
}
