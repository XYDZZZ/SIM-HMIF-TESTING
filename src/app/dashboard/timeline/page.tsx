import Link from "next/link";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarProker } from "@/lib/actions/proker";
import { Badge } from "@/components/ui/Badge";

const warnaTitik: Record<string, string> = {
  Direncanakan: "bg-ink-400 border-ink-400",
  Berjalan: "bg-signal-500 border-signal-500 shadow-[0_0_10px_2px_rgba(232,163,61,0.5)]",
  Selesai: "bg-ok-500 border-ok-500",
  Dibatalkan: "bg-danger-500 border-danger-500",
};

const warnaBadge: Record<string, "netral" | "signal" | "ok" | "danger"> = {
  Direncanakan: "netral",
  Berjalan: "signal",
  Selesai: "ok",
  Dibatalkan: "danger",
};

export default async function HalamanTimeline() {
  const periodeAktif = await getPeriodeAktif();
  if (!periodeAktif) return <p className="text-sm text-paper-300">Belum ada periode aktif.</p>;

  const daftar = await daftarProker(periodeAktif.id_periode);
  const terurut = [...daftar].sort((a, b) => {
    if (!a.tanggal_mulai) return 1;
    if (!b.tanggal_mulai) return -1;
    return a.tanggal_mulai.localeCompare(b.tanggal_mulai);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-paper-100">Timeline Proker</h1>
        <p className="mt-1 text-sm text-paper-300">
          Periode {periodeAktif.nama_periode} &middot; diurutkan dari tanggal mulai
        </p>
      </div>

      {terurut.length === 0 ? (
        <p className="text-sm text-paper-300">Belum ada proker di periode ini.</p>
      ) : (
        <div className="relative pl-8">
          {/* garis rute vertikal */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-ink-600" />

          <div className="space-y-6">
            {terurut.map((p) => (
              <div key={p.id_proker} className="relative">
                <span
                  className={`absolute -left-8 top-1.5 h-3.5 w-3.5 rounded-full border-2 ${warnaTitik[p.status_proker] ?? "bg-ink-400 border-ink-400"}`}
                />
                <Link
                  href={`/dashboard/proker/${p.id_proker}`}
                  className="block rounded-xl border border-ink-700 bg-ink-900/60 p-5 transition-colors hover:border-signal-500/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-base text-paper-100">{p.nama_proker}</p>
                    <Badge warna={warnaBadge[p.status_proker] ?? "netral"}>{p.status_proker}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-paper-300">
                    {/* @ts-expect-error -- hasil join Supabase */}
                    {p.divisi?.nama_divisi ?? "Proker Bersama"}
                    {p.tanggal_mulai && (
                      <>
                        {" "}
                        &middot; {p.tanggal_mulai}
                        {p.tanggal_selesai && ` s/d ${p.tanggal_selesai}`}
                      </>
                    )}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
