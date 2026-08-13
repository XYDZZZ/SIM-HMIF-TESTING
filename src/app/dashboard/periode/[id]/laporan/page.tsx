import { redirect } from "next/navigation";
import Link from "next/link";
import { detailPeriode } from "@/lib/actions/periode";
import { rekapKeaktifanPeriode, rekapLPJPeriode } from "@/lib/actions/laporan";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { Badge } from "@/components/ui/Badge";

export default async function HalamanLaporanPeriode({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin && konteks.nama_role !== "BPH") {
    return <p className="text-sm text-paper-300">Laporan periode khusus BPH.</p>;
  }

  const { periode } = await detailPeriode(id);
  if (!periode) return <p className="text-sm text-paper-300">Periode tidak ditemukan.</p>;

  const tabAktif = tab ?? "keaktifan";
  const [keaktifan, lpj] = await Promise.all([
    tabAktif === "keaktifan" ? rekapKeaktifanPeriode(id) : Promise.resolve([]),
    tabAktif === "lpj" ? rekapLPJPeriode(id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/periode/${id}`} className="text-sm text-signal-400 hover:underline">
        &larr; {periode.nama_periode}
      </Link>

      <div>
        <h1 className="font-display text-2xl text-paper-100">Laporan Periode</h1>
        <p className="mt-1 text-sm text-paper-300">{periode.nama_periode}</p>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/dashboard/periode/${id}/laporan?tab=keaktifan`}
          className={`rounded-md border px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] ${
            tabAktif === "keaktifan" ? "border-signal-500 bg-signal-500/10 text-signal-400" : "border-ink-600 text-paper-300"
          }`}
        >
          Keaktifan Anggota
        </Link>
        <Link
          href={`/dashboard/periode/${id}/laporan?tab=lpj`}
          className={`rounded-md border px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] ${
            tabAktif === "lpj" ? "border-signal-500 bg-signal-500/10 text-signal-400" : "border-ink-600 text-paper-300"
          }`}
        >
          Rangkuman LPJ
        </Link>
      </div>

      {tabAktif === "keaktifan" && (
        <div className="overflow-x-auto rounded-lg border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
              <tr>
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">NIM</th>
                <th className="px-3 py-2.5">Jabatan / Divisi</th>
                <th className="px-3 py-2.5">Poin Keaktifan</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {keaktifan.map((a) => (
                <tr key={a.id_anggota_periode} className="border-t border-ink-700">
                  <td className="px-3 py-2.5 text-paper-100">{a.users?.nama_lengkap}</td>
                  <td className="px-3 py-2.5 text-paper-300">{a.users?.nim}</td>
                  <td className="px-3 py-2.5 text-paper-300">{a.nama_jabatan ?? a.nama_divisi ?? a.nama_role}</td>
                  <td className="px-3 py-2.5 text-signal-400">{a.total_poin}</td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/dashboard/periode/${id}/laporan/keaktifan/${a.id_anggota_periode}`}
                      className="text-xs text-signal-400 hover:underline"
                    >
                      Cetak Surat Keterangan
                    </Link>
                  </td>
                </tr>
              ))}
              {keaktifan.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-paper-300">
                    Belum ada anggota di periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tabAktif === "lpj" && (
        <div className="space-y-4">
          {lpj.map((p) => {
            const divisiObj = p.divisi as unknown as { nama_divisi: string } | null;
            return (
              <div key={p.id_proker} className="rounded-xl border border-ink-700 bg-ink-900/60 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display text-base text-paper-100">{p.nama_proker}</p>
                  <Badge warna="ok">{divisiObj?.nama_divisi ?? "Proker Bersama"}</Badge>
                </div>
                <p className="mt-1 text-xs text-paper-300">
                  {p.tanggal_mulai} s/d {p.tanggal_selesai}
                </p>

                {p.lpj_ringkasan ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-paper-300">Ringkasan Pelaksanaan</p>
                      <p className="text-paper-100">{p.lpj_ringkasan}</p>
                    </div>
                    {p.lpj_kendala && (
                      <div>
                        <p className="text-paper-300">Kendala</p>
                        <p className="text-paper-100">{p.lpj_kendala}</p>
                      </div>
                    )}
                    {p.lpj_rekomendasi && (
                      <div>
                        <p className="text-paper-300">Rekomendasi</p>
                        <p className="text-paper-100">{p.lpj_rekomendasi}</p>
                      </div>
                    )}
                    {p.lpj_url_dokumen && (
                      <a href={p.lpj_url_dokumen} target="_blank" rel="noreferrer" className="inline-block text-xs text-signal-400 hover:underline">
                        Lihat dokumen LPJ lengkap &rarr;
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-paper-300">LPJ belum diisi untuk proker ini.</p>
                )}
              </div>
            );
          })}
          {lpj.length === 0 && (
            <p className="text-sm text-paper-300">Belum ada proker berstatus Selesai di periode ini.</p>
          )}
        </div>
      )}
    </div>
  );
}
