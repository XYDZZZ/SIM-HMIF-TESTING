import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { daftarKasPending } from "@/lib/actions/kas";
import { TombolVerifikasiKas } from "@/components/kas/TombolVerifikasiKas";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function HalamanVerifikasiKas() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin && konteks.nama_jabatan !== "Bendahara") {
    return <p className="text-sm text-paper-300">Hanya Bendahara yang bisa memverifikasi kas.</p>;
  }

  const pending = await daftarKasPending();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/kas" className="text-sm text-signal-400 hover:underline">
        &larr; Kas
      </Link>
      <h1 className="font-display text-2xl text-paper-100">Verifikasi Pembayaran ({pending.length})</h1>

      <div className="space-y-3">
        {pending.map((t) => {
          const u = t.users as unknown as { nama_lengkap: string; nim: string };
          const tagihan = t.tagihan_khusus as unknown as { nama_tagihan: string } | null;
          return (
            <div key={t.id_transaksi} className="rounded-xl border border-ink-700 bg-ink-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-paper-100">
                    {u.nama_lengkap} <span className="text-paper-300">({u.nim})</span>
                  </p>
                  <p className="mt-1 text-sm text-paper-300">
                    {tagihan?.nama_tagihan ?? "Kas Rutin"} &middot; {formatRupiah(Number(t.nominal))} &middot;{" "}
                    {t.metode_pembayaran}
                  </p>
                  {t.bukti_url && (
                    <a
                      href={t.bukti_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm text-signal-400 hover:underline"
                    >
                      Lihat bukti transfer &rarr;
                    </a>
                  )}
                </div>
                <TombolVerifikasiKas id_transaksi={t.id_transaksi} />
              </div>
            </div>
          );
        })}

        {pending.length === 0 && <p className="text-sm text-paper-300">Tidak ada pembayaran yang menunggu verifikasi.</p>}
      </div>
    </div>
  );
}
