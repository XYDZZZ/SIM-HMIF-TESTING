import Link from "next/link";
import { daftarKatalog, daftarStok, daftarTransaksi } from "@/lib/actions/danus";

export default async function HalamanDashboardMitra() {
  const [katalog, stok, transaksi] = await Promise.all([daftarKatalog(), daftarStok(), daftarTransaksi()]);

  const stokKritis = stok.filter((s) => Number(s.stok_saat_ini) < Number(s.batas_minimum));
  const transaksiSelesai = transaksi.filter((t) => t.status_transaksi === "Selesai");
  const totalOmzet = transaksiSelesai.reduce((s, t) => s + Number(t.total_omzet), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-paper-100">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
          <p className="font-display text-[10px] uppercase tracking-[0.12em] text-paper-300">Produk Aktif</p>
          <p className="mt-1.5 font-display text-xl text-paper-100">{katalog.filter((k) => k.status === "Aktif").length}</p>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
          <p className="font-display text-[10px] uppercase tracking-[0.12em] text-paper-300">Total Omzet</p>
          <p className="mt-1.5 font-display text-xl text-signal-400">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalOmzet)}
          </p>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
          <p className="font-display text-[10px] uppercase tracking-[0.12em] text-paper-300">Bahan di Bawah Batas Minimum</p>
          <p className="mt-1.5 font-display text-xl text-danger-500">{stokKritis.length}</p>
        </div>
      </div>

      {stokKritis.length > 0 && (
        <div className="rounded-xl border border-danger-500/40 bg-danger-500/10 p-5">
          <p className="font-display text-[11px] uppercase tracking-[0.12em] text-danger-500 mb-2">Peringatan Stok</p>
          <ul className="space-y-1 text-sm text-paper-100">
            {stokKritis.map((s) => (
              <li key={s.id_barang}>
                {s.nama_bahan}: {s.stok_saat_ini} {s.satuan} (batas minimum {s.batas_minimum})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/mitra/transaksi" className="rounded-md bg-signal-500 px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.1em] text-ink-950 hover:bg-signal-400">
          Catat Transaksi
        </Link>
        <Link href="/mitra/katalog" className="rounded-md border border-ink-600 px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.1em] text-paper-100 hover:border-signal-500">
          Kelola Produk
        </Link>
      </div>
    </div>
  );
}
