import Link from "next/link";
import { notFound } from "next/navigation";
import { detailAnggotaPeriode } from "@/lib/actions/periode";

export default async function HalamanProfilAnggota({
  params,
}: {
  params: Promise<{ id: string; id_anggota_periode: string }>;
}) {
  const { id, id_anggota_periode } = await params;
  const hasil = await detailAnggotaPeriode(id_anggota_periode);

  if (!hasil) notFound();
  const { anggota, total_poin } = hasil;
  const data = anggota as unknown as {
    users: { nim: string; nama_lengkap: string; angkatan: string; tahun_masuk_organisasi: string; nomor_whatsapp: string };
    roles: { nama_role: string } | null;
    jabatan: { nama_jabatan: string } | null;
    divisi: { nama_divisi: string } | null;
    periode: { nama_periode: string };
  };
  const user = data.users;
  const namaRole = data.roles?.nama_role;
  const namaJabatan = data.jabatan?.nama_jabatan;
  const namaDivisi = data.divisi?.nama_divisi;
  const namaPeriode = data.periode?.nama_periode;

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/periode/${id}`} className="text-sm text-signal-400 hover:underline">
        &larr; Kembali ke {namaPeriode}
      </Link>

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <h1 className="font-display text-2xl text-paper-100">{user?.nama_lengkap}</h1>
        <p className="mt-1 text-sm text-paper-300">
          {namaJabatan ?? namaDivisi ?? namaRole} &middot; {namaPeriode}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
          <InfoField label="NIM" value={user?.nim} />
          <InfoField label="Angkatan" value={user?.angkatan} />
          <InfoField label="Tahun Masuk HIMATIF" value={user?.tahun_masuk_organisasi} />
          <InfoField label="Nomor WhatsApp" value={user?.nomor_whatsapp} />
          <InfoField label="Role" value={namaRole} />
          <InfoField label="Jabatan / Divisi" value={namaJabatan ?? namaDivisi ?? "-"} />
        </div>
      </div>

      <div className="rounded-xl border border-signal-500/30 bg-ink-900/60 p-7">
        <p className="font-display text-[11px] uppercase tracking-[0.14em] text-paper-300">
          Poin Keaktifan &middot; {namaPeriode}
        </p>
        <p className="mt-2 font-display text-4xl text-signal-400">{total_poin}</p>
        <p className="mt-1 text-xs text-paper-300">
          Dihitung otomatis dari akumulasi bobot kegiatan yang dihadiri (Tepat Waktu/Terlambat).
        </p>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="font-display text-[10px] uppercase tracking-[0.12em] text-paper-300">{label}</p>
      <p className="mt-1 text-sm text-paper-100">{value || "-"}</p>
    </div>
  );
}
