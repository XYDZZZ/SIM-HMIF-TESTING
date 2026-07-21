import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarProkerUntukDropdown } from "@/lib/actions/kegiatan";
import { FormBuatKegiatan } from "@/components/kegiatan/FormBuatKegiatan";

export default async function HalamanBuatKegiatan() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin && konteks.nama_role !== "BPH") {
    return <p className="text-sm text-paper-300">Hanya BPH yang bisa membuat kegiatan.</p>;
  }

  const periodeAktif = await getPeriodeAktif();
  if (!periodeAktif) return <p className="text-sm text-paper-300">Belum ada periode aktif.</p>;

  const proker = await daftarProkerUntukDropdown(periodeAktif.id_periode);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/kegiatan" className="text-sm text-signal-400 hover:underline">
        &larr; Kegiatan
      </Link>
      <h1 className="font-display text-2xl text-paper-100">Buat Kegiatan Baru</h1>

      <div className="max-w-lg rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <FormBuatKegiatan id_periode={periodeAktif.id_periode} daftarProker={proker} />
      </div>
    </div>
  );
}
