import Link from "next/link";
import { daftarPeriode } from "@/lib/actions/periode";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { Badge } from "@/components/ui/Badge";
import { FormPeriodeBaru } from "@/components/periode/FormPeriodeBaru";

export default async function HalamanDaftarPeriode() {
  const [periodeList, konteks] = await Promise.all([daftarPeriode(), getKonteksPengguna()]);
  const adaPeriodeAktif = periodeList.some((p) => p.status_aktif);
  const isSuperadmin = konteks?.tipe === "anggota" && konteks.is_superadmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-paper-100">Periode Kepengurusan</h1>
          <p className="mt-1 text-sm text-paper-300">
            Setiap periode adalah ruang terpisah — data periode yang sudah berakhir bersifat baca-saja.
          </p>
        </div>
      </div>

      {isSuperadmin && <FormPeriodeBaru adaPeriodeAktif={adaPeriodeAktif} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {periodeList.map((p) => (
          <Link
            key={p.id_periode}
            href={`/dashboard/periode/${p.id_periode}`}
            className="group rounded-xl border border-ink-700 bg-ink-900/60 p-5 transition-colors hover:border-signal-500/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-lg text-paper-100 group-hover:text-signal-400">
                {p.nama_periode}
              </span>
              {p.status_aktif ? <Badge warna="ok">Aktif</Badge> : <Badge warna="netral">Terkunci</Badge>}
            </div>
            <p className="text-sm text-paper-300">Tahun {p.tahun}</p>
          </Link>
        ))}

        {periodeList.length === 0 && (
          <p className="text-sm text-paper-300">Belum ada periode. Buka periode pertama di atas.</p>
        )}
      </div>
    </div>
  );
}
