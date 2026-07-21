import { getKonteksPengguna } from "@/lib/auth/authorize";

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

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-6">
        <p className="font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-3">
          Modul lain (Proker, Absensi, Kas, Danus, Manajemen Periode) sedang dalam tahap
          pengembangan selanjutnya.
        </p>
      </div>
    </div>
  );
}
