import Link from "next/link";
import { notFound } from "next/navigation";
import { detailProduk, daftarStok } from "@/lib/actions/danus";
import { FormResepProduk } from "@/components/mitra/FormResepProduk";

export default async function HalamanDetailProdukMitra({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ produk, resep }, stok] = await Promise.all([detailProduk(id), daftarStok()]);
  if (!produk) notFound();

  return (
    <div className="space-y-6">
      <Link href="/mitra/katalog" className="text-sm text-signal-400 hover:underline">
        &larr; Katalog
      </Link>

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <h1 className="font-display text-2xl text-paper-100">{produk.nama_item}</h1>
        <p className="mt-1 text-sm text-paper-300">
          Rp{Number(produk.harga_jual).toLocaleString("id-ID")} &middot; {produk.persentase_margin_himatif}% margin HMIF
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
          Resep (Bahan Baku per 1 Unit Terjual)
        </h2>
        <FormResepProduk
          id_produk={id}
          daftarBahan={stok.map((s) => ({ id_barang: s.id_barang, nama_bahan: s.nama_bahan, satuan: s.satuan }))}
          resepAwal={resep.map((r) => ({ id_barang: r.id_barang, jumlah_pemakaian: Number(r.jumlah_pemakaian) }))}
        />
      </section>
    </div>
  );
}
