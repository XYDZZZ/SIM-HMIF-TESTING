import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { FormPengeluaran } from "@/components/kas/FormPengeluaran";

export default async function HalamanPengeluaran() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin && konteks.nama_jabatan !== "Bendahara") {
    return <p className="text-sm text-paper-300">Hanya Bendahara yang bisa mencatat pengeluaran.</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/kas" className="text-sm text-signal-400 hover:underline">
        &larr; Kas
      </Link>
      <h1 className="font-display text-2xl text-paper-100">Catat Pengeluaran</h1>

      <div className="max-w-lg rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <FormPengeluaran />
      </div>
    </div>
  );
}
