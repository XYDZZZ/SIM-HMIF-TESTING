import Link from "next/link";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarKegiatan } from "@/lib/actions/kegiatan";
import { getKonteksPengguna } from "@/lib/auth/authorize";

export default async function HalamanDaftarKegiatan() {
  const [periodeAktif, konteks] = await Promise.all([getPeriodeAktif(), getKonteksPengguna()]);

  if (!periodeAktif) return <p className="text-sm text-paper-300">Belum ada periode aktif.</p>;

  const daftar = await daftarKegiatan(periodeAktif.id_periode);
  const bolehBuat = konteks?.tipe === "anggota" && (konteks.is_superadmin || konteks.nama_role === "BPH");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-paper-100">Kegiatan</h1>
          <p className="mt-1 text-sm text-paper-300">
            Rapat & acara yang jadi dasar pencatatan absensi. Periode {periodeAktif.nama_periode}
          </p>
        </div>
        {bolehBuat && (
          <Link
            href="/dashboard/kegiatan/baru"
            className="rounded-md bg-signal-500 px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.1em] text-ink-950 hover:bg-signal-400"
          >
            Kegiatan Baru
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {daftar.map((k) => (
          <Link
            key={k.id_kegiatan}
            href={`/dashboard/kegiatan/${k.id_kegiatan}`}
            className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900/60 px-5 py-4 transition-colors hover:border-signal-500/50"
          >
            <div>
              <p className="text-paper-100">{k.nama_kegiatan}</p>
              <p className="mt-0.5 text-xs text-paper-300">
                {new Date(k.waktu_mulai).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                {/* @ts-expect-error -- hasil join Supabase */}
                {k.proker?.nama_proker && ` · ${k.proker.nama_proker}`}
              </p>
            </div>
            <span className="font-display text-xs text-signal-400">{k.bobot_poin} poin</span>
          </Link>
        ))}

        {daftar.length === 0 && <p className="text-sm text-paper-300">Belum ada kegiatan di periode ini.</p>}
      </div>
    </div>
  );
}
