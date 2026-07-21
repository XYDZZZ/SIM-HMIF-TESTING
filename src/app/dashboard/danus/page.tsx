import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { daftarSemuaMitra } from "@/lib/actions/danus";
import { Badge } from "@/components/ui/Badge";
import { TombolAccMitra } from "@/components/mitra/TombolAccMitra";

const warnaStatus: Record<string, "netral" | "signal" | "ok" | "danger"> = {
  Menunggu: "signal",
  Disetujui: "ok",
  Ditolak: "danger",
};

export default async function HalamanDanusOversight() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");

  const jabatanBoleh = ["Ketua", "Wakil Ketua", "Sekretaris", "Bendahara"];
  if (!konteks.is_superadmin && !jabatanBoleh.includes(konteks.nama_jabatan ?? "")) {
    return <p className="text-sm text-paper-300">Anda tidak memiliki hak untuk melihat oversight Danus.</p>;
  }

  const bolehAcc = konteks.is_superadmin || ["Ketua", "Wakil Ketua"].includes(konteks.nama_jabatan ?? "");
  const daftar = await daftarSemuaMitra();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-paper-100">Oversight Danus &amp; Mitra</h1>

      <div className="space-y-3">
        {daftar.map((m) => (
          <div key={m.id_mitra} className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href={`/dashboard/danus/${m.id_mitra}`} className="text-paper-100 hover:text-signal-400">
                  {m.nama_usaha}
                </Link>
                <p className="mt-1 text-sm text-paper-300">
                  {m.nama_pemilik} &middot; {m.kontak_whatsapp}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge warna={warnaStatus[m.status_pendaftaran] ?? "netral"}>{m.status_pendaftaran}</Badge>
                {bolehAcc && m.status_pendaftaran === "Menunggu" && <TombolAccMitra id_mitra={m.id_mitra} />}
              </div>
            </div>
          </div>
        ))}
        {daftar.length === 0 && <p className="text-sm text-paper-300">Belum ada mitra yang mendaftar.</p>}
      </div>
    </div>
  );
}
