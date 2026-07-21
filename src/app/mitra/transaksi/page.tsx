import Link from "next/link";
import { daftarKatalog, daftarTransaksi } from "@/lib/actions/danus";
import { FormBuatTransaksi } from "@/components/mitra/FormBuatTransaksi";
import { TombolBatalkanTransaksi } from "@/components/mitra/TombolBatalkanTransaksi";
import { Badge } from "@/components/ui/Badge";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function HalamanTransaksiMitra() {
  const [katalog, transaksi] = await Promise.all([daftarKatalog(), daftarTransaksi()]);
  const produkAktif = katalog.filter((k) => k.status === "Aktif");

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-paper-100">Transaksi</h1>

      <div className="max-w-md rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <FormBuatTransaksi
          produkAktif={produkAktif.map((p) => ({ id_produk: p.id_produk, nama_item: p.nama_item, harga_jual: Number(p.harga_jual) }))}
        />
      </div>

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">Riwayat Transaksi</h2>
        <div className="overflow-x-auto rounded-lg border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
              <tr>
                <th className="px-3 py-2.5">Waktu</th>
                <th className="px-3 py-2.5">Produk</th>
                <th className="px-3 py-2.5">Qty</th>
                <th className="px-3 py-2.5">Omzet</th>
                <th className="px-3 py-2.5">Hak Mitra</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {transaksi.map((t) => {
                const p = t.danus_katalog as unknown as { nama_item: string };
                return (
                  <tr key={t.id_penjualan} className="border-t border-ink-700">
                    <td className="px-3 py-2.5 text-paper-300">
                      {new Date(t.waktu_transaksi).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-3 py-2.5 text-paper-100">{p?.nama_item}</td>
                    <td className="px-3 py-2.5 text-paper-300">{t.kuantitas}</td>
                    <td className="px-3 py-2.5 text-paper-100">{formatRupiah(Number(t.total_omzet))}</td>
                    <td className="px-3 py-2.5 text-paper-100">{formatRupiah(Number(t.hak_mitra))}</td>
                    <td className="px-3 py-2.5">
                      <Badge warna={t.status_transaksi === "Selesai" ? "ok" : "danger"}>{t.status_transaksi}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <Link href={`/mitra/struk/${t.id_penjualan}`} className="text-xs text-signal-400 hover:underline">
                          Cetak
                        </Link>
                        {t.status_transaksi === "Selesai" && <TombolBatalkanTransaksi id_penjualan={t.id_penjualan} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {transaksi.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-paper-300">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
