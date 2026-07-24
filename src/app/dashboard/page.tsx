import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";

const menuUtama = [
  { href: "/dashboard/periode", label: "Periode", deskripsi: "Kelola periode kepengurusan & keanggotaan" },
  { href: "/dashboard/proker", label: "Proker", deskripsi: "Program kerja divisi & bersama" },
  { href: "/dashboard/kegiatan", label: "Kegiatan", deskripsi: "Rapat, absensi, dan poin keaktifan" },
  { href: "/dashboard/kas", label: "Kas", deskripsi: "Transparansi keuangan & tagihan khusus" },
  { href: "/dashboard/danus", label: "Danus", deskripsi: "Oversight mitra & kemitraan usaha" },
];

export default async function HalamanDashboard() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-paper-100">Selamat datang, {konteks.nama_lengkap.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-paper-300">
          {konteks.id_periode_aktif
            ? "Anda tercatat pada periode kepengurusan yang sedang berjalan."
            : "Anda belum ditugaskan ke periode kepengurusan aktif. Hubungi Ketua/Superadmin."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {menuUtama.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-xl border border-ink-700 bg-ink-900/60 p-5 transition-colors hover:border-signal-500/50"
          >
            <p className="font-display text-sm text-paper-100 group-hover:text-signal-400">{m.label}</p>
            <p className="mt-1.5 text-sm text-paper-300">{m.deskripsi}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
