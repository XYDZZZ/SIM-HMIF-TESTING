import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { daftarKasManual } from "@/lib/actions/kas";
import { Badge } from "@/components/ui/Badge";
import { FormEditTransaksiManual } from "@/components/kas/FormEditTransaksiManual";
import { TombolHapusTransaksiManual } from "@/components/kas/TombolHapusTransaksiManual";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function HalamanKelolaTransaksiManual() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin && konteks.nama_jabatan !== "Bendahara") {
    return <p className="text-sm text-paper-300">Halaman ini khusus Bendahara.</p>;
  }

  const daftar = await daftarKasManual();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/kas" className="text-sm text-signal-400 hover:underline">
        &larr; Kas
      </Link>
      <div>
        <h1 className="font-display text-2xl text-paper-100">Kelola Transaksi Manual</h1>
        <p className="mt-1 text-sm text-paper-300">
          Edit atau hapus entri yang kamu input langsung (tunai & pengeluaran). Transaksi otomatis dari
          Danus tidak muncul di sini — itu dikelola lewat pembatalan transaksi di Portal Mitra.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
            <tr>
              <th className="px-3 py-2.5">Tanggal</th>
              <th className="px-3 py-2.5">Nama</th>
              <th className="px-3 py-2.5">Jenis</th>
              <th className="px-3 py-2.5">Nominal / Keterangan</th>
              <th className="px-3 py-2.5">Bukti</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((t) => {
              const u = t.users as unknown as { nama_lengkap: string } | null;
              return (
                <tr key={t.id_transaksi} className="border-t border-ink-700">
                  <td className="px-3 py-2.5 text-paper-300">
                    {new Date(t.dibuat_pada).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                  </td>
                  <td className="px-3 py-2.5 text-paper-100">{u?.nama_lengkap ?? "-"}</td>
                  <td className="px-3 py-2.5">
                    <Badge warna={t.jenis === "Masuk" ? "ok" : "danger"}>{t.jenis}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <FormEditTransaksiManual
                      id_transaksi={t.id_transaksi}
                      nominalAwal={Number(t.nominal)}
                      keteranganAwal={t.keterangan}
                    />
                    <p className="mt-0.5 text-xs text-paper-300">
                      {formatRupiah(Number(t.nominal))} {t.keterangan && `· ${t.keterangan}`}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    {t.url_bukti_tampil ? (
                      <a href={t.url_bukti_tampil} target="_blank" rel="noreferrer" className="text-xs text-signal-400 hover:underline">
                        Lihat
                      </a>
                    ) : (
                      <span className="text-xs text-paper-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <TombolHapusTransaksiManual id_transaksi={t.id_transaksi} />
                  </td>
                </tr>
              );
            })}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-paper-300">
                  Belum ada transaksi manual.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
