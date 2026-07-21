import Link from "next/link";
import { notFound } from "next/navigation";
import { detailKegiatan } from "@/lib/actions/kegiatan";
import { daftarAbsensiKegiatan, anggotaBelumAbsen } from "@/lib/actions/absensi";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { Badge } from "@/components/ui/Badge";
import { EditorBobotPoin } from "@/components/kegiatan/EditorBobotPoin";
import { ScannerQR } from "@/components/absensi/ScannerQR";
import { FormInputManual } from "@/components/absensi/FormInputManual";

const warnaStatusKehadiran: Record<string, "netral" | "signal" | "ok" | "danger"> = {
  "Tepat Waktu": "ok",
  Terlambat: "signal",
  Izin: "netral",
  Sakit: "netral",
};

export default async function HalamanDetailKegiatan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [kegiatan, konteks] = await Promise.all([detailKegiatan(id), getKonteksPengguna()]);
  if (!kegiatan) notFound();

  const prokerObj = kegiatan.proker as unknown as { nama_proker: string; id_divisi: string | null } | null;
  const periodeObj = kegiatan.periode as unknown as { status_aktif: boolean } | null;

  const [absensi, calonManual] = await Promise.all([
    daftarAbsensiKegiatan(id),
    periodeObj?.status_aktif ? anggotaBelumAbsen(id, kegiatan.id_periode) : Promise.resolve([]),
  ]);

  const bolehKelola =
    konteks?.tipe === "anggota" &&
    periodeObj?.status_aktif &&
    (konteks.is_superadmin ||
      konteks.nama_jabatan === "Sekretaris" ||
      (konteks.nama_role === "Kadiv" && prokerObj?.id_divisi && konteks.id_divisi === prokerObj.id_divisi));

  return (
    <div className="space-y-8">
      <Link href="/dashboard/kegiatan" className="text-sm text-signal-400 hover:underline">
        &larr; Kegiatan
      </Link>

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <h1 className="font-display text-2xl text-paper-100">{kegiatan.nama_kegiatan}</h1>
        <p className="mt-1 text-sm text-paper-300">
          {new Date(kegiatan.waktu_mulai).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
          {prokerObj?.nama_proker && ` · ${prokerObj.nama_proker}`}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          <p className="text-sm text-paper-300">
            Toleransi telat: <span className="text-paper-100">{kegiatan.toleransi_menit} menit</span>
          </p>
          <div className="flex items-center gap-2 text-sm text-paper-300">
            Bobot poin:
            {bolehKelola ? (
              <EditorBobotPoin id_kegiatan={id} bobotAwal={kegiatan.bobot_poin} />
            ) : (
              <span className="text-paper-100">{kegiatan.bobot_poin}</span>
            )}
          </div>
        </div>
      </div>

      {bolehKelola && (
        <section className="rounded-xl border border-ink-700 bg-ink-900/60 p-7">
          <h2 className="mb-4 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
            Mode Scan Kehadiran
          </h2>
          <ScannerQR id_kegiatan={id} />
        </section>
      )}

      {bolehKelola && (
        <section className="rounded-xl border border-ink-700 bg-ink-900/60 p-7">
          <h2 className="mb-4 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
            Input Manual (backup / izin / sakit)
          </h2>
          <FormInputManual id_kegiatan={id} calonAnggota={calonManual.map((a) => {
            const u = a.users as unknown as { nim: string; nama_lengkap: string };
            return { id_user: a.id_user, nim: u.nim, nama_lengkap: u.nama_lengkap };
          })} />
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
          Daftar Hadir ({absensi.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
              <tr>
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">Waktu</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Metode</th>
              </tr>
            </thead>
            <tbody>
              {absensi.map((a) => {
                const u = a.users as unknown as { nama_lengkap: string; nim: string };
                return (
                  <tr key={a.id_absensi} className="border-t border-ink-700">
                    <td className="px-3 py-2.5 text-paper-100">{u?.nama_lengkap}</td>
                    <td className="px-3 py-2.5 text-paper-300">
                      {a.waktu_absen
                        ? new Date(a.waktu_absen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                        : "-"}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge warna={warnaStatusKehadiran[a.status_kehadiran] ?? "netral"}>
                        {a.status_kehadiran}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-paper-300">{a.metode_absen}</td>
                  </tr>
                );
              })}
              {absensi.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-paper-300">
                    Belum ada yang tercatat hadir.
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
