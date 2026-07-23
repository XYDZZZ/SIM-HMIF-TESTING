import Link from "next/link";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarKasTransaksi, ringkasanKas } from "@/lib/actions/kas";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { Badge } from "@/components/ui/Badge";

const kategoriTab = ["Semua", "Kas Rutin", "Kas Danus", "Kas Tagihan Khusus"];

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const warnaStatus: Record<string, "netral" | "signal" | "ok" | "danger"> = {
  Pending: "signal",
  Lunas: "ok",
  Ditolak: "danger",
};

export default async function HalamanKas({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const [periodeAktif, konteks, ringkasan] = await Promise.all([
    getPeriodeAktif(),
    getKonteksPengguna(),
    ringkasanKas(),
  ]);

  const transaksi = await daftarKasTransaksi(
    periodeAktif?.id_periode ?? "",
    kategori && kategori !== "Semua" ? kategori : undefined
  );

  const isBendahara =
    konteks?.tipe === "anggota" && (konteks.is_superadmin || konteks.nama_jabatan === "Bendahara");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-paper-100">Kas HMIF</h1>
          <p className="mt-1 text-sm text-paper-300">Transparan bagi seluruh anggota.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/kas/bayar"
            className="rounded-md border border-ink-600 px-4 py-2 font-display text-[12px] uppercase tracking-[0.08em] text-paper-100 hover:border-signal-500"
          >
            Ajukan Pembayaran
          </Link>
          {isBendahara && (
            <>
              <Link
                href="/dashboard/kas/verifikasi"
                className="rounded-md border border-ink-600 px-4 py-2 font-display text-[12px] uppercase tracking-[0.08em] text-paper-100 hover:border-signal-500"
              >
                Verifikasi
              </Link>
              <Link
                href="/dashboard/kas/tagihan"
                className="rounded-md border border-ink-600 px-4 py-2 font-display text-[12px] uppercase tracking-[0.08em] text-paper-100 hover:border-signal-500"
              >
                Tagihan Khusus
              </Link>
              <Link
                href="/dashboard/kas/kelola"
                className="rounded-md border border-ink-600 px-4 py-2 font-display text-[12px] uppercase tracking-[0.08em] text-paper-100 hover:border-signal-500"
              >
                Kelola Manual
              </Link>
              <Link
                href="/dashboard/kas/pengeluaran"
                className="rounded-md bg-signal-500 px-4 py-2 font-display text-[12px] uppercase tracking-[0.08em] text-ink-950 hover:bg-signal-400"
              >
                Catat Pengeluaran
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <RingkasanCard label="Total Masuk" nilai={ringkasan.totalMasuk} warna="ok" />
        <RingkasanCard label="Total Keluar" nilai={ringkasan.totalKeluar} warna="danger" />
        <RingkasanCard label="Saldo" nilai={ringkasan.saldo} warna="signal" />
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {kategoriTab.map((k) => (
          <Link
            key={k}
            href={k === "Semua" ? "/dashboard/kas" : `/dashboard/kas?kategori=${encodeURIComponent(k)}`}
            className={`whitespace-nowrap rounded-md border px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] ${
              (kategori ?? "Semua") === k
                ? "border-signal-500 bg-signal-500/10 text-signal-400"
                : "border-ink-600 text-paper-300 hover:text-paper-100"
            }`}
          >
            {k}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
            <tr>
              <th className="px-3 py-2.5">Tanggal</th>
              <th className="px-3 py-2.5">Nama</th>
              <th className="px-3 py-2.5">Kategori</th>
              <th className="px-3 py-2.5">Jenis</th>
              <th className="px-3 py-2.5">Nominal</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {transaksi.map((t) => {
              const u = t.users as unknown as { nama_lengkap: string } | null;
              const tagihan = t.tagihan_khusus as unknown as { nama_tagihan: string } | null;
              return (
                <tr key={t.id_transaksi} className="border-t border-ink-700">
                  <td className="px-3 py-2.5 text-paper-300">
                    {new Date(t.dibuat_pada).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                  </td>
                  <td className="px-3 py-2.5 text-paper-100">{u?.nama_lengkap ?? "-"}</td>
                  <td className="px-3 py-2.5 text-paper-300">{tagihan?.nama_tagihan ?? t.kategori}</td>
                  <td className="px-3 py-2.5 text-paper-300">{t.jenis}</td>
                  <td className="px-3 py-2.5 text-paper-100">{formatRupiah(Number(t.nominal))}</td>
                  <td className="px-3 py-2.5">
                    <Badge warna={warnaStatus[t.status] ?? "netral"}>{t.status}</Badge>
                  </td>
                </tr>
              );
            })}
            {transaksi.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-paper-300">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RingkasanCard({ label, nilai, warna }: { label: string; nilai: number; warna: "ok" | "danger" | "signal" }) {
  const kelasTeks = { ok: "text-ok-500", danger: "text-danger-500", signal: "text-signal-400" }[warna];
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
      <p className="font-display text-[10px] uppercase tracking-[0.12em] text-paper-300">{label}</p>
      <p className={`mt-1.5 font-display text-xl ${kelasTeks}`}>{formatRupiah(nilai)}</p>
    </div>
  );
}
