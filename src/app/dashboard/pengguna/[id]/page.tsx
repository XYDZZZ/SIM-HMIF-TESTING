import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { daftarSemuaUser, daftarPenugasanUser } from "@/lib/actions/pengguna";
import { FormEditUser } from "@/components/pengguna/FormEditUser";
import { TombolHapusUser } from "@/components/pengguna/TombolHapusUser";
import { TombolHapusPenugasan } from "@/components/pengguna/TombolHapusPenugasan";
import { Badge } from "@/components/ui/Badge";

export default async function HalamanKelolaPengguna({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin) {
    return <p className="text-sm text-paper-300">Halaman ini khusus Superadmin.</p>;
  }

  const [semuaUser, penugasan] = await Promise.all([daftarSemuaUser(), daftarPenugasanUser(id)]);
  const user = semuaUser.find((u) => u.id_user === id);
  if (!user) notFound();

  return (
    <div className="space-y-8">
      <Link href="/dashboard/pengguna" className="text-sm text-signal-400 hover:underline">
        &larr; Manajemen Pengguna
      </Link>

      <div className="max-w-lg rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <h1 className="mb-5 font-display text-xl text-paper-100">{user.nama_lengkap}</h1>
        <FormEditUser user={user} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
          Riwayat Penugasan Periode
        </h2>
        <div className="space-y-2">
          {penugasan.map((p) => {
            const periode = p.periode as unknown as { nama_periode: string; status_aktif: boolean };
            const role = p.roles as unknown as { nama_role: string } | null;
            const jabatan = p.jabatan as unknown as { nama_jabatan: string } | null;
            const divisi = p.divisi as unknown as { nama_divisi: string } | null;
            return (
              <div
                key={p.id_anggota_periode}
                className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-paper-100">
                    {periode.nama_periode} &middot; {jabatan?.nama_jabatan ?? divisi?.nama_divisi ?? role?.nama_role}
                  </p>
                  {!periode.status_aktif && (
                    <Badge warna="netral">Periode Terkunci</Badge>
                  )}
                </div>
                <TombolHapusPenugasan id_anggota_periode={p.id_anggota_periode} />
              </div>
            );
          })}
          {penugasan.length === 0 && <p className="text-sm text-paper-300">Belum pernah ditugaskan ke periode manapun.</p>}
        </div>
      </section>

      {!user.is_superadmin && (
        <section>
          <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-danger-500">Zona Berbahaya</h2>
          <TombolHapusUser id_user={user.id_user} />
        </section>
      )}
    </div>
  );
}
