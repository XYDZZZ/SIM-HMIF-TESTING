import { daftarStok } from "@/lib/actions/danus";
import { FormTambahBahan } from "@/components/mitra/FormTambahBahan";
import { TombolRestock } from "@/components/mitra/TombolRestock";
import { Badge } from "@/components/ui/Badge";

export default async function HalamanStokMitra() {
  const stok = await daftarStok();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-paper-100">Stok Bahan Baku</h1>
        <FormTambahBahan />
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
            <tr>
              <th className="px-3 py-2.5">Bahan</th>
              <th className="px-3 py-2.5">Stok Saat Ini</th>
              <th className="px-3 py-2.5">Batas Minimum</th>
              <th className="px-3 py-2.5"></th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {stok.map((s) => {
              const kritis = Number(s.stok_saat_ini) < 0;
              const rendah = !kritis && Number(s.stok_saat_ini) < Number(s.batas_minimum);
              return (
                <tr key={s.id_barang} className="border-t border-ink-700">
                  <td className="px-3 py-2.5 text-paper-100">{s.nama_bahan}</td>
                  <td className="px-3 py-2.5 text-paper-100">
                    {s.stok_saat_ini} {s.satuan}
                  </td>
                  <td className="px-3 py-2.5 text-paper-300">
                    {s.batas_minimum} {s.satuan}
                  </td>
                  <td className="px-3 py-2.5">
                    {kritis && <Badge warna="danger">Minus</Badge>}
                    {rendah && <Badge warna="signal">Rendah</Badge>}
                  </td>
                  <td className="px-3 py-2.5">
                    <TombolRestock id_barang={s.id_barang} />
                  </td>
                </tr>
              );
            })}
            {stok.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-paper-300">
                  Belum ada bahan baku.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
