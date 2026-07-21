import Link from "next/link";
import { daftarKatalog } from "@/lib/actions/danus";
import { FormTambahProduk } from "@/components/mitra/FormTambahProduk";
import { TogglStatusProduk } from "@/components/mitra/TogglStatusProduk";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function HalamanKatalogMitra() {
  const katalog = await daftarKatalog();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-paper-100">Katalog Produk</h1>
        <FormTambahProduk />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {katalog.map((p) => (
          <div key={p.id_produk} className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
            <div className="flex items-start justify-between">
              <Link href={`/mitra/katalog/${p.id_produk}`} className="text-paper-100 hover:text-signal-400">
                {p.nama_item}
              </Link>
              <TogglStatusProduk id_produk={p.id_produk} status={p.status} />
            </div>
            <p className="mt-1.5 text-sm text-paper-300">
              {formatRupiah(Number(p.harga_jual))} &middot; {p.persentase_margin_himatif}% margin HIMATIF
            </p>
            <Link href={`/mitra/katalog/${p.id_produk}`} className="mt-2 inline-block text-xs text-signal-400 hover:underline">
              Atur resep bahan baku &rarr;
            </Link>
          </div>
        ))}
        {katalog.length === 0 && <p className="text-sm text-paper-300">Belum ada produk. Tambahkan dulu di atas.</p>}
      </div>
    </div>
  );
}
