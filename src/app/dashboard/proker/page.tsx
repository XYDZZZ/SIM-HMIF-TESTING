import Link from "next/link";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarProker } from "@/lib/actions/proker";
import { Badge } from "@/components/ui/Badge";

const warnaStatus: Record<string, "netral" | "signal" | "ok" | "danger"> = {
  Direncanakan: "netral",
  Berjalan: "signal",
  Selesai: "ok",
  Dibatalkan: "danger",
};

export default async function HalamanDaftarProker() {
  const periodeAktif = await getPeriodeAktif();

  if (!periodeAktif) {
    return <p className="text-sm text-paper-300">Belum ada periode aktif.</p>;
  }

  const daftar = await daftarProker(periodeAktif.id_periode);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-paper-100">Program Kerja</h1>
          <p className="mt-1 text-sm text-paper-300">Periode {periodeAktif.nama_periode}</p>
        </div>
        <Link
          href="/dashboard/proker/baru"
          className="rounded-md bg-signal-500 px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.1em] text-ink-950 hover:bg-signal-400"
        >
          Proker Baru
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {daftar.map((p) => (
          <Link
            key={p.id_proker}
            href={`/dashboard/proker/${p.id_proker}`}
            className="group rounded-xl border border-ink-700 bg-ink-900/60 p-5 transition-colors hover:border-signal-500/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-base text-paper-100 group-hover:text-signal-400">
                {p.nama_proker}
              </span>
              <Badge warna={warnaStatus[p.status_proker] ?? "netral"}>{p.status_proker}</Badge>
            </div>
            <p className="text-sm text-paper-300">
              {/* @ts-expect-error -- hasil join Supabase */}
              {p.divisi?.nama_divisi ?? "Proker Bersama"}
            </p>
          </Link>
        ))}

        {daftar.length === 0 && <p className="text-sm text-paper-300">Belum ada proker di periode ini.</p>}
      </div>
    </div>
  );
}
