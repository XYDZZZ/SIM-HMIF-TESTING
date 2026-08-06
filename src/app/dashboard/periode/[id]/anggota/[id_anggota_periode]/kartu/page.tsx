import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { detailAnggotaPeriode } from "@/lib/actions/periode";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { TombolCetakKartu } from "@/components/periode/TombolCetakKartu";

export default async function HalamanKartuAnggota({
  params,
}: {
  params: Promise<{ id: string; id_anggota_periode: string }>;
}) {
  const { id, id_anggota_periode } = await params;

  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin && konteks.nama_jabatan !== "Sekretaris") {
    return <p className="text-sm text-paper-300">Cetak/kirim ulang ID Card khusus Superadmin atau Sekretaris.</p>;
  }

  const hasil = await detailAnggotaPeriode(id_anggota_periode);
  if (!hasil) notFound();

  const data = hasil.anggota as unknown as {
    users: { nim: string; nama_lengkap: string; kode_kartu: string };
    jabatan: { nama_jabatan: string } | null;
    divisi: { nama_divisi: string } | null;
    periode: { nama_periode: string };
  };

  const qrDataUrl = await QRCode.toDataURL(data.users.kode_kartu, {
    width: 300,
    margin: 1,
    color: { dark: "#0a0e14", light: "#ffffff" },
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/periode/${id}/anggota/${id_anggota_periode}`}
        className="text-sm text-signal-400 hover:underline print:hidden"
      >
        &larr; Profil Anggota
      </Link>

      <p className="text-xs text-paper-300 print:hidden">
        Buat cetak fisik, klik <span className="text-paper-100">Cetak ID Card</span> di bawah. Buat kirim ulang
        foto QR kalau kartu ketinggalan/hilang, klik-kanan gambar QR di bawah lalu simpan gambar, atau
        screenshot bagian kartunya untuk dikirim manual lewat WhatsApp.
      </p>

      <div className="flex justify-center">
        <div className="w-[340px] rounded-2xl border border-ink-700 bg-ink-900/80 p-6 font-display print:border-2 print:border-black print:bg-white print:text-black">
          <div className="mb-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-signal-400 print:text-black">
              Kartu Tanda Anggota
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.15em] text-paper-300 print:text-black">
              HMIF · {data.periode.nama_periode}
            </p>
          </div>

          <div className="rule-signal mb-4 print:bg-black" />

          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Kode Kartu" className="h-40 w-40 rounded-lg border border-ink-600 bg-white p-2" />
          </div>

          <div className="mt-4 space-y-1 text-center">
            <p className="text-base text-paper-100 print:text-black">{data.users.nama_lengkap}</p>
            <p className="text-sm text-paper-300 print:text-black">{data.users.nim}</p>
            <p className="text-xs uppercase tracking-[0.1em] text-signal-400 print:text-black">
              {data.jabatan?.nama_jabatan ?? data.divisi?.nama_divisi ?? "Anggota"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <TombolCetakKartu />
      </div>
    </div>
  );
}
