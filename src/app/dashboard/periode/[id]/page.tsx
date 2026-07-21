import Link from "next/link";
import { notFound } from "next/navigation";
import {
  detailPeriode,
  strukturKepengurusan,
  calonAnggotaBelumDiassign,
  anggotaDariPeriodeLain,
  daftarRoleJabatanDivisi,
} from "@/lib/actions/periode";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { Badge } from "@/components/ui/Badge";
import { FormAssignSatuan } from "@/components/periode/FormAssignSatuan";
import { FormAssignMassal } from "@/components/periode/FormAssignMassal";

type BarisAnggota = {
  id_anggota_periode: string;
  users: { nim: string; nama_lengkap: string } | null;
  jabatan: { nama_jabatan: string } | null;
};

function BarisOrang({ id_periode, a, keterangan }: { id_periode: string; a: BarisAnggota; keterangan?: string }) {
  return (
    <Link
      href={`/dashboard/periode/${id_periode}/anggota/${a.id_anggota_periode}`}
      className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-2.5 text-sm hover:border-signal-500/50"
    >
      <span className="text-paper-100">{a.users?.nama_lengkap}</span>
      <span className="text-paper-300">
        {keterangan && <span className="mr-3">{keterangan}</span>}
        {a.users?.nim}
      </span>
    </Link>
  );
}

export default async function HalamanDetailPeriode({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ periode }, struktur, konteks, { roles, jabatan, divisi }] = await Promise.all([
    detailPeriode(id),
    strukturKepengurusan(id),
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

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
            Struktur Kepengurusan ({struktur.totalAnggota})
          </h2>
        </div>

        {/* BPH */}
        <div>
          <p className="mb-2 font-display text-[11px] uppercase tracking-[0.1em] text-signal-400">BPH</p>
          <div className="space-y-1.5">
            {struktur.bph.map((a) => (
              <BarisOrang
                key={a.id_anggota_periode}
                id_periode={id}
                a={a as unknown as BarisAnggota}
                keterangan={(a.jabatan as unknown as { nama_jabatan: string } | null)?.nama_jabatan}
              />
            ))}
            {struktur.bph.length === 0 && <p className="text-sm text-paper-300">Belum ada BPH ditugaskan.</p>}
          </div>
        </div>

        {/* Per divisi */}
        {struktur.perDivisi.map((d) => (
          <div key={d.nama_divisi}>
            <p className="mb-2 font-display text-[11px] uppercase tracking-[0.1em] text-signal-400">
              {d.nama_divisi}
            </p>
            <div className="space-y-1.5">
              {d.kadiv.map((a) => (
                <BarisOrang key={a.id_anggota_periode} id_periode={id} a={a as unknown as BarisAnggota} keterangan="Kadiv" />
              ))}
              {d.anggota.map((a) => (
                <BarisOrang key={a.id_anggota_periode} id_periode={id} a={a as unknown as BarisAnggota} />
              ))}
              {d.kadiv.length === 0 && d.anggota.length === 0 && (
                <p className="text-sm text-paper-300">Belum ada anggota di divisi ini.</p>
              )}
            </div>
          </div>
        ))}

        {struktur.tanpaDivisi.length > 0 && (
          <div>
            <p className="mb-2 font-display text-[11px] uppercase tracking-[0.1em] text-signal-400">
              Belum Terikat Divisi
            </p>
            <div className="space-y-1.5">
              {struktur.tanpaDivisi.map((a) => (
                <BarisOrang key={a.id_anggota_periode} id_periode={id} a={a as unknown as BarisAnggota} />
              ))}
            </div>
          </div>
        )}
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
