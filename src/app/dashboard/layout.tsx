import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { TombolLogout } from "@/components/auth/TombolLogout";
import { NavMobile } from "@/components/ui/NavMobile";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");

  const itemNav = [
    { href: "/dashboard/periode", label: "Periode" },
    { href: "/dashboard/proker", label: "Proker" },
    { href: "/dashboard/timeline", label: "Timeline" },
    { href: "/dashboard/kegiatan", label: "Kegiatan" },
    { href: "/dashboard/kas", label: "Kas" },
    { href: "/dashboard/danus", label: "Danus" },
    ...(konteks.is_superadmin || konteks.nama_role === "BPH"
      ? [{ href: "/dashboard/surat", label: "Surat" }]
      : []),
    ...(konteks.is_superadmin ? [{ href: "/dashboard/pengguna", label: "Pengguna" }] : []),
  ];

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="relative border-b border-ink-700 bg-ink-900/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-signal-500 shadow-[0_0_8px_2px_rgba(232,163,61,0.5)]" />
              <span className="font-display text-[12px] uppercase tracking-[0.2em] text-paper-300">
                SIM · HIMATIF
              </span>
            </Link>
            <nav className="hidden gap-5 sm:flex">
              {itemNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <NavMobile items={itemNav} />
            <div className="hidden text-right sm:block">
              <p className="text-sm text-paper-100">{konteks.nama_lengkap}</p>
              <p className="font-display text-[11px] uppercase tracking-[0.1em] text-signal-400">
                {konteks.is_superadmin
                  ? "Superadmin"
                  : konteks.nama_jabatan ?? konteks.nama_role ?? "Belum ada penugasan periode"}
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
