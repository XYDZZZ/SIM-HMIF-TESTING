import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { detailKeaktifanAnggota } from "@/lib/actions/laporan";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { TombolCetakKeterangan } from "@/components/periode/TombolCetakKeterangan";

export default async function HalamanSuratKeterangan({
  params,
}: {
  params: Promise<{ id: string; id_anggota_periode: string }>;
}) {
  const { id, id_anggota_periode } = await params;

  const konteks = await getKonteksPengguna();
  if (!konteks) redirect("/login");

  const hasil = await detailKeaktifanAnggota(id_anggota_periode);
  if (!hasil || !hasil.user || !hasil.periode) notFound();

  // Boleh dilihat BPH/Superadmin (siapa saja), atau anggota yang bersangkutan (self-print)
  const bolehLihat =
    konteks.tipe === "anggota" &&
    (konteks.is_superadmin || konteks.nama_role === "BPH");
  if (!bolehLihat) {
    return <p className="text-sm text-paper-300">Surat keterangan ini hanya bisa dilihat BPH/Superadmin.</p>;
  }

  const { user, periode, jabatan, divisi, riwayat, totalPoin, totalKegiatan } = hasil;

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/periode/${id}/laporan`} className="text-sm text-signal-400 hover:underline print:hidden">
        &larr; Laporan Periode
      </Link>

      <div className="mx-auto max-w-2xl rounded-2xl border border-ink-700 bg-ink-900/80 p-8 print:border-2 print:border-black print:bg-white print:text-black">
        <div className="text-center">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-paper-300 print:text-black">
            Himpunan Mahasiswa Informatika
          </p>
          <p className="mt-1 font-display text-lg text-paper-100 print:text-black">Surat Keterangan Keaktifan</p>
        </div>

        <div className="rule-signal my-6 print:bg-black" />

        <p className="text-sm text-paper-100 print:text-black">
          Yang bertanda tangan di bawah ini menerangkan bahwa:
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-paper-100 print:text-black">
          <span className="text-paper-300 print:text-black">Nama</span>
          <span className="col-span-2">: {user?.nama_lengkap}</span>
          <span className="text-paper-300 print:text-black">NIM</span>
          <span className="col-span-2">: {user?.nim}</span>
          <span className="text-paper-300 print:text-black">Jabatan / Divisi</span>
          <span className="col-span-2">: {jabatan?.nama_jabatan ?? divisi?.nama_divisi ?? "Anggota"}</span>
        </div>

        <p className="mt-4 text-sm text-paper-100 print:text-black">
          adalah benar tercatat aktif sebagai anggota HMIF pada periode kepengurusan{" "}
          <strong>{periode?.nama_periode}</strong>, dengan rekap keikutsertaan kegiatan sebagai berikut:
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-ink-700 p-4 text-center print:border-black">
            <p className="text-2xl text-signal-400 print:text-black">{totalKegiatan}</p>
            <p className="text-xs text-paper-300 print:text-black">Kegiatan Dihadiri</p>
          </div>
          <div className="rounded-lg border border-ink-700 p-4 text-center print:border-black">
            <p className="text-2xl text-signal-400 print:text-black">{totalPoin}</p>
            <p className="text-xs text-paper-300 print:text-black">Total Poin Keaktifan</p>
          </div>
        </div>

        {riwayat.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-[0.1em] text-paper-300 print:text-black">
              Rincian Kehadiran
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink-700 text-left text-paper-300 print:border-black print:text-black">
                  <th className="py-1.5 pr-2">Kegiatan</th>
                  <th className="py-1.5 pr-2">Tanggal</th>
                  <th className="py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r, i) => (
                  <tr key={i} className="border-b border-ink-800 text-paper-100 print:border-gray-300 print:text-black">
                    <td className="py-1.5 pr-2">{r.nama_kegiatan}</td>
                    <td className="py-1.5 pr-2">
                      {r.waktu_mulai ? new Date(r.waktu_mulai).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"}
                    </td>
                    <td className="py-1.5">{r.status_kehadiran}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-sm text-paper-100 print:text-black">
          Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.
        </p>

        <div className="mt-10 text-right text-sm text-paper-100 print:text-black">
          <p>{new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
          <p className="mt-1">Ketua Umum HMIF</p>
          <div className="mt-14" />
          <p className="border-t border-paper-300 pt-1 print:border-black">( ..................................... )</p>
        </div>
      </div>

      <div className="flex justify-center">
        <TombolCetakKeterangan />
      </div>
    </div>
  );
}
