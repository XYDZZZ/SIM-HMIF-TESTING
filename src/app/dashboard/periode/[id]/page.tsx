import Link from "next/link";
import { notFound } from "next/navigation";
import {
  detailPeriode,
  calonAnggotaBelumDiassign,
  anggotaDariPeriodeLain,
  daftarRoleJabatanDivisi,
} from "@/lib/actions/periode";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { Badge } from "@/components/ui/Badge";
import { FormAssignSatuan } from "@/components/periode/FormAssignSatuan";
import { FormAssignMassal } from "@/components/periode/FormAssignMassal";

export default async function HalamanDetailPeriode({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ periode, anggota }, konteks, { roles, jabatan, divisi }] = await Promise.all([
    detailPeriode(id),
    getKonteksPengguna(),
    daftarRoleJabatanDivisi(),
  ]);

  if (!periode) notFound();

  const bolehAssign =
    konteks?.tipe === "anggota" &&
    periode.status_aktif &&
    (konteks.is_superadmin ||
      (konteks.nama_role === "BPH" && ["Ketua", "Wakil Ketua"].includes(konteks.nama_jabatan ?? "")));

  const [calonSatuan, massal] = bolehAssign
    ? await Promise.all([calonAnggotaBelumDiassign(id), anggotaDariPeriodeLain(id)])
    : [[], { dariPeriode: null, anggota: [] }];

  const opsiRoles = roles.map((r) => ({ id: r.id_role, label: r.nama_role }));
  const opsiJabatan = jabatan.map((j) => ({ id: j.id_jabatan, label: j.nama_jabatan }));
  const opsiDivisi = divisi.map((d) => ({ id: d.id_divisi, label: d.nama_divisi }));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/periode" className="text-sm text-signal-400 hover:underline">
          &larr; Semua Periode
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-display text-2xl text-paper-100">{periode.nama_periode}</h1>
          {periode.status_aktif ? <Badge warna="ok">Aktif</Badge> : <Badge warna="netral">Terkunci</Badge>}
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
          Anggota Periode Ini ({anggota.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
              <tr>
                <th className="px-3 py-2.5">Nama</th>
                <th className="px-3 py-2.5">NIM</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Jabatan / Divisi</th>
              </tr>
            </thead>
            <tbody>
              {anggota.map((a) => (
                <tr key={a.id_anggota_periode} className="border-t border-ink-700 hover:bg-ink-900/60">
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/dashboard/periode/${id}/anggota/${a.id_anggota_periode}`}
                      className="text-paper-100 hover:text-signal-400"
                    >
                      {/* @ts-expect-error -- hasil join Supabase */}
                      {a.users?.nama_lengkap}
                    </Link>
                  </td>
                  {/* @ts-expect-error -- hasil join Supabase */}
                  <td className="px-3 py-2.5 text-paper-300">{a.users?.nim}</td>
                  <td className="px-3 py-2.5 text-paper-300">
                    {/* @ts-expect-error -- hasil join Supabase */}
                    {a.roles?.nama_role}
                  </td>
                  <td className="px-3 py-2.5 text-paper-300">
                    {/* @ts-expect-error -- hasil join Supabase */}
                    {a.jabatan?.nama_jabatan ?? a.divisi?.nama_divisi ?? "-"}
                  </td>
                </tr>
              ))}
              {anggota.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-paper-300">
                    Belum ada anggota di periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {bolehAssign && (
        <>
          {massal.dariPeriode && (
            <section className="rounded-xl border border-ink-700 bg-ink-900/60 p-6">
              <h2 className="mb-4 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
                Pindahkan Anggota dari Periode Sebelumnya
              </h2>
              <FormAssignMassal
                id_periode_baru={id}
                namaPeriodeLama={massal.dariPeriode.nama_periode}
                calon={massal.anggota.map((a) => ({
                  id_user: a.id_user,
                  // @ts-expect-error -- hasil join Supabase
                  nim: a.users?.nim,
                  // @ts-expect-error -- hasil join Supabase
                  nama_lengkap: a.users?.nama_lengkap,
                  // @ts-expect-error -- hasil join Supabase
                  nama_role_lama: a.roles?.nama_role ?? null,
                  // @ts-expect-error -- hasil join Supabase
                  nama_jabatan_lama: a.jabatan?.nama_jabatan ?? null,
                  // @ts-expect-error -- hasil join Supabase
                  nama_divisi_lama: a.divisi?.nama_divisi ?? null,
                }))}
                roles={opsiRoles}
                jabatan={opsiJabatan}
                divisi={opsiDivisi}
              />
            </section>
          )}

          <section className="rounded-xl border border-ink-700 bg-ink-900/60 p-6">
            <h2 className="mb-4 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
              Tambahkan Anggota Baru ke Periode Ini
            </h2>
            <FormAssignSatuan
              id_periode={id}
              calonAnggota={calonSatuan}
              roles={opsiRoles}
              jabatan={opsiJabatan}
              divisi={opsiDivisi}
            />
          </section>
        </>
      )}
    </div>
  );
}
