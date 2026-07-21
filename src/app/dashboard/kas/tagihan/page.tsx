import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarTagihanKhusus } from "@/lib/actions/kas";
import { FormTagihanKhusus } from "@/components/kas/FormTagihanKhusus";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function HalamanTagihanKhusus() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin && konteks.nama_jabatan !== "Bendahara") {
    return <p className="text-sm text-paper-300">Hanya Bendahara yang bisa mengelola tagihan khusus.</p>;
  }

  const periodeAktif = await getPeriodeAktif();
  if (!periodeAktif) return <p className="text-sm text-paper-300">Belum ada periode aktif.</p>;

  const tagihan = await daftarTagihanKhusus(periodeAktif.id_periode);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/kas" className="text-sm text-signal-400 hover:underline">
        &larr; Kas
      </Link>
      <h1 className="font-display text-2xl text-paper-100">Tagihan Khusus</h1>

      <div className="max-w-lg rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <FormTagihanKhusus id_periode={periodeAktif.id_periode} />
      </div>

      <div className="space-y-2">
        {tagihan.map((t) => (
          <div key={t.id_tagihan} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900/60 px-5 py-3.5">
            <span className="text-paper-100">{t.nama_tagihan}</span>
            <div className="flex items-center gap-4 text-sm text-paper-300">
              <span>{formatRupiah(Number(t.nominal))}</span>
              {t.deadline && <span>Deadline: {t.deadline}</span>}
            </div>
          </div>
        ))}
        {tagihan.length === 0 && <p className="text-sm text-paper-300">Belum ada tagihan khusus.</p>}
      </div>
    </div>
  );
}
