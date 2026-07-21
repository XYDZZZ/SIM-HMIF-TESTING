import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { TombolLogout } from "@/components/auth/TombolLogout";

export default async function MitraLayout({ children }: { children: React.ReactNode }) {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "mitra") redirect("/login");

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="border-b border-ink-700 bg-ink-900/60 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-6">
            <Link href="/mitra" className="font-display text-[12px] uppercase tracking-[0.2em] text-paper-300">
              PORTAL MITRA
            </Link>
            <nav className="hidden gap-5 sm:flex">
              <Link
                href="/mitra/katalog"
                className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
              >
                Katalog
              </Link>
              <Link
                href="/mitra/stok"
                className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
              >
                Stok
              </Link>
              <Link
                href="/mitra/transaksi"
                className="font-display text-[11px] uppercase tracking-[0.1em] text-paper-300 hover:text-signal-400"
              >
                Transaksi
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-paper-100">{konteks.nama_usaha}</p>
            <TombolLogout />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
