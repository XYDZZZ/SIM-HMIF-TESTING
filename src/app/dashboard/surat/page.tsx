import { redirect } from "next/navigation";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarSurat, rekapPerBulan } from "@/lib/actions/surat";
import { KODE_JENIS_SURAT } from "@/lib/constants/surat";
import { FormCatatSurat } from "@/components/surat/FormCatatSurat";
import { Badge } from "@/components/ui/Badge";

export default async function HalamanSurat({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string }>;
}) {
  const { jenis } = await searchParams;
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin && konteks.nama_role !== "BPH") {
    return <p className="text-sm text-paper-300">Modul Surat khusus BPH.</p>;
  }

  const periodeAktif = await getPeriodeAktif();
  if (!periodeAktif) return <p className="text-sm text-paper-300">Belum ada periode aktif.</p>;

  const [surat, rekap] = await Promise.all([
    daftarSurat(periodeAktif.id_periode, jenis ? { jenis } : undefined),
    rekapPerBulan(periodeAktif.id_periode),
  ]);

  const bolehCatat = konteks.is_superadmin || konteks.nama_jabatan === "Sekretaris";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-paper-100">Surat Masuk / Keluar</h1>
        <p className="mt-1 text-sm text-paper-300">Periode {periodeAktif.nama_periode}</p>
      </div>

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-5 space-y-4">
        <p className="font-display text-[11px] uppercase tracking-[0.14em] text-signal-400">
          Panduan Penomoran Surat Keluar
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-paper-300 mb-1.5">Surat Kepengurusan</p>
            <p className="font-display text-sm text-paper-100">XXX/KODE/HMIF-UNPERBA/ROMAWI/TAHUN</p>
            <p className="mt-1.5 text-xs text-paper-300">
              Contoh: <span className="text-paper-100">021/UND/HMIF-UNPERBA/VIII/2026</span>. Nomor urut jalan
              terus selama periode kepengurusan aktif, reset ke 001 di awal periode baru.
            </p>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-paper-300 mb-1.5">Surat Kepanitiaan</p>
            <p className="font-display text-sm text-paper-100">XXX/KODE/PANPEL/KODE-KEGIATAN/ROMAWI/TAHUN</p>
            <p className="mt-1.5 text-xs text-paper-300">
              Contoh: <span className="text-paper-100">015/UND/PANPEL/MUBES/VIII/2026</span>. Nomor urut terpisah
              untuk tiap kepanitiaan/kegiatan, tidak ikut reset periode maupun tahun.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs uppercase tracking-[0.08em] text-paper-300">Kode Jenis Surat</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-paper-300 sm:grid-cols-3">
            {KODE_JENIS_SURAT.map((k) => (
              <p key={k.kode}>
                <span className="text-paper-100">{k.kode}</span> — {k.label}
              </p>
            ))}
          </div>
        </div>

        <p className="text-xs text-paper-300">
          Klik <span className="text-paper-100">Saran Nomor</span> di form untuk mengambil nomor urut berikutnya
          secara otomatis sesuai kategori yang dipilih.
        </p>
      </div>

      {bolehCatat && (
        <section className="max-w-lg rounded-xl border border-ink-700 bg-ink-900/60 p-7">
          <h2 className="mb-4 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">Catat Surat</h2>
          <FormCatatSurat id_periode={periodeAktif.id_periode} />
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
          Rekap per Bulan
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(rekap).map(([bulan, jumlah]) => (
            <div key={bulan} className="rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-3">
              <p className="text-sm text-paper-100">{bulan}</p>
              <p className="mt-1 text-xs text-paper-300">
                Masuk: {jumlah.masuk} &middot; Keluar: {jumlah.keluar}
              </p>
            </div>
          ))}
          {Object.keys(rekap).length === 0 && <p className="text-sm text-paper-300">Belum ada data.</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 flex gap-2">
          {["Semua", "Masuk", "Keluar"].map((j) => (
            <a
              key={j}
              href={j === "Semua" ? "/dashboard/surat" : `/dashboard/surat?jenis=${j}`}
              className={`rounded-md border px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] ${
                (jenis ?? "Semua") === j
                  ? "border-signal-500 bg-signal-500/10 text-signal-400"
                  : "border-ink-600 text-paper-300"
              }`}
            >
              {j}
            </a>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
              <tr>
                <th className="px-3 py-2.5">Tanggal</th>
                <th className="px-3 py-2.5">Nomor</th>
                <th className="px-3 py-2.5">Perihal</th>
                <th className="px-3 py-2.5">Dari/Kepada</th>
                <th className="px-3 py-2.5">Kategori</th>
                <th className="px-3 py-2.5">Jenis</th>
              </tr>
            </thead>
            <tbody>
              {surat.map((s) => (
                <tr key={s.id_surat} className="border-t border-ink-700">
                  <td className="px-3 py-2.5 text-paper-300">{s.tanggal_surat}</td>
                  <td className="px-3 py-2.5 text-paper-100">
                    {s.url_dokumen ? (
                      <a href={s.url_dokumen} target="_blank" rel="noreferrer" className="hover:text-signal-400 hover:underline">
                        {s.nomor_surat}
                      </a>
                    ) : (
                      s.nomor_surat
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-paper-300">{s.perihal}</td>
                  <td className="px-3 py-2.5 text-paper-300">{s.asal_tujuan ?? "-"}</td>
                  <td className="px-3 py-2.5 text-paper-300">
                    {s.kategori_penerbit ? `${s.kategori_penerbit}${s.kode_kegiatan ? ` · ${s.kode_kegiatan}` : ""}` : "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge warna={s.jenis === "Masuk" ? "signal" : "ok"}>{s.jenis}</Badge>
                  </td>
                </tr>
              ))}
              {surat.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-paper-300">
                    Belum ada surat tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
