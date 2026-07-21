import Link from "next/link";
import { notFound } from "next/navigation";
import { detailMitraOversight } from "@/lib/actions/danus";
import { Badge } from "@/components/ui/Badge";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function HalamanDetailMitraOversight({ params }: { params: Promise<{ id_mitra: string }> }) {
  const { id_mitra } = await params;
  const { mitra, katalog, stok, transaksi } = await detailMitraOversight(id_mitra);
  if (!mitra) notFound();

  return (
    <div className="space-y-8">
      <Link href="/dashboard/danus" className="text-sm text-signal-400 hover:underline">
        &larr; Oversight Danus
      </Link>

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <h1 className="font-display text-2xl text-paper-100">{mitra.nama_usaha}</h1>
        <p className="mt-1 text-sm text-paper-300">
          {mitra.nama_pemilik} &middot; {mitra.kontak_whatsapp}
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
          Katalog ({katalog.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {katalog.map((k) => (
            <div key={k.id_produk} className="rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-3">
              <p className="text-paper-100">{k.nama_item}</p>
              <p className="text-sm text-paper-300">
                {formatRupiah(Number(k.harga_jual))} &middot; {k.persentase_margin_himatif}%
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
          Stok ({stok.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {stok.map((s) => (
            <div key={s.id_barang} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-3">
              <span className="text-paper-100">{s.nama_bahan}</span>
              <span className="text-sm text-paper-300">
                {s.stok_saat_ini} / min {s.batas_minimum} {s.satuan}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
          Transaksi Terbaru
        </h2>
        <div className="overflow-x-auto rounded-lg border border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
              <tr>
                <th className="px-3 py-2.5">Waktu</th>
                <th className="px-3 py-2.5">Produk</th>
                <th className="px-3 py-2.5">Omzet</th>
                <th className="px-3 py-2.5">Hak HIMATIF</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.map((t) => {
                const row = t as { id_penjualan: string; waktu_transaksi: string; total_omzet: number; hak_himatif: number; status_transaksi: string; danus_katalog: { nama_item: string } };
                return (
                  <tr key={row.id_penjualan} className="border-t border-ink-700">
                    <td className="px-3 py-2.5 text-paper-300">
                      {new Date(row.waktu_transaksi).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-3 py-2.5 text-paper-100">{row.danus_katalog?.nama_item}</td>
                    <td className="px-3 py-2.5 text-paper-100">{formatRupiah(Number(row.total_omzet))}</td>
                    <td className="px-3 py-2.5 text-paper-100">{formatRupiah(Number(row.hak_himatif))}</td>
                    <td className="px-3 py-2.5">
                      <Badge warna={row.status_transaksi === "Selesai" ? "ok" : "danger"}>{row.status_transaksi}</Badge>
                    </td>
                  </tr>
                );
              })}
              {transaksi.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-paper-300">
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
