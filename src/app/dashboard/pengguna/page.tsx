import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { daftarSemuaUser } from "@/lib/actions/pengguna";
import { Badge } from "@/components/ui/Badge";

export default async function HalamanDaftarPengguna() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");
  if (!konteks.is_superadmin) {
    return <p className="text-sm text-paper-300">Halaman ini khusus Superadmin.</p>;
  }

  const daftar = await daftarSemuaUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-paper-100">Manajemen Pengguna</h1>
        <p className="mt-1 text-sm text-paper-300">Edit data, koreksi penugasan periode, atau hapus akun uji coba.</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
            <tr>
              <th className="px-3 py-2.5">Nama</th>
              <th className="px-3 py-2.5">NIM</th>
              <th className="px-3 py-2.5">WhatsApp</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((u) => (
              <tr key={u.id_user} className="border-t border-ink-700">
                <td className="px-3 py-2.5 text-paper-100">
                  {u.nama_lengkap} {u.is_superadmin && <Badge warna="signal">Superadmin</Badge>}
                </td>
                <td className="px-3 py-2.5 text-paper-300">{u.nim}</td>
                <td className="px-3 py-2.5 text-paper-300">{u.nomor_whatsapp}</td>
                <td className="px-3 py-2.5">
                  <Badge warna={u.status === "Aktif" ? "ok" : "danger"}>{u.status}</Badge>
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/dashboard/pengguna/${u.id_user}`} className="text-signal-400 hover:underline">
                    Kelola
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
