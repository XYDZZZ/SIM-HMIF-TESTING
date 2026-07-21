import { notFound } from "next/navigation";
import { detailStruk } from "@/lib/actions/danus";
import { TombolCetak } from "@/components/mitra/TombolCetak";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function HalamanStruk({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const struk = await detailStruk(id);
  if (!struk) notFound();

  const produk = struk.danus_katalog as unknown as {
    nama_item: string;
    harga_jual: number;
    mitra: { nama_usaha: string };
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-900/60 p-7 font-display print:border-black print:bg-white print:text-black">
        <div className="mb-4 text-center">
          <p className="text-sm uppercase tracking-[0.14em] text-paper-300 print:text-black">{produk.mitra.nama_usaha}</p>
          <p className="mt-1 text-xs text-paper-300 print:text-black">Nota Digital &middot; HIMATIF</p>
        </div>

        <div className="rule-signal mb-4 print:bg-black" />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-paper-300 print:text-black">{produk.nama_item}</span>
            <span className="text-paper-100 print:text-black">x{struk.kuantitas}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-paper-300 print:text-black">Harga satuan</span>
            <span className="text-paper-100 print:text-black">{formatRupiah(Number(produk.harga_jual))}</span>
          </div>
        </div>

        <div className="rule-signal my-4 print:bg-black" />

        <div className="flex justify-between text-base">
          <span className="text-paper-100 print:text-black">Total</span>
          <span className="text-signal-400 print:text-black">{formatRupiah(Number(struk.total_omzet))}</span>
        </div>

        <p className="mt-4 text-center text-[11px] text-paper-300 print:text-black">
          {new Date(struk.waktu_transaksi).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}
        </p>

        {struk.status_transaksi === "Dibatalkan" && (
          <p className="mt-3 text-center text-xs uppercase tracking-[0.1em] text-danger-500">Transaksi Dibatalkan</p>
        )}
      </div>

      <TombolCetak />
    </div>
  );
}
