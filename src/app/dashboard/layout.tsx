import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { TombolLogout } from "@/components/auth/TombolLogout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="border-b border-ink-700 bg-ink-900/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-signal-500 shadow-[0_0_8px_2px_rgba(232,163,61,0.5)]" />
              <span className="font-display text-[12px] uppercase tracking-[0.2em] text-paper-300">
                SIM-HMIF
              </span>
            </Link>
            <nav className="hidden gap-5 sm:flex">
              <Link
                href="/dashboard/periode"
                className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
              >
                Periode
              </Link>
              <Link
                href="/dashboard/proker"
                className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
              >
                Proker
              </Link>
              <Link
                href="/dashboard/kegiatan"
                className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
              >
                Kegiatan
              </Link>
              <Link
                href="/dashboard/kas"
                className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
              >
                Kas
              </Link>
              <Link
                href="/dashboard/danus"
                className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
              >
                Danus
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-paper-100">{konteks.nama_lengkap}</p>
              <p className="font-display text-[11px] uppercase tracking-[0.1em] text-signal-400">
                {konteks.is_superadmin
                  ? "Superadmin"
                  : (konteks.nama_jabatan ??
                    konteks.nama_role ??
                    "Belum ada penugasan periode")}
              </p>
            </div>
            <TombolLogout />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
