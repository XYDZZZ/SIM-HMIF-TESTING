import { getPeriodeAktif } from "@/lib/actions/periode";
import { daftarProker } from "@/lib/actions/proker";
import { daftarKegiatan } from "@/lib/actions/kegiatan";
import { TimelineVisual, type ItemTimeline } from "@/components/timeline/TimelineVisual";

export default async function HalamanTimeline({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const periodeAktif = await getPeriodeAktif();
  if (!periodeAktif) return <p className="text-sm text-paper-300">Belum ada periode aktif.</p>;

  const [proker, kegiatan] = await Promise.all([
    daftarProker(periodeAktif.id_periode),
    daftarKegiatan(periodeAktif.id_periode),
  ]);

  const prokerBersama = proker.filter((p) => !(p.divisi as unknown as { nama_divisi: string } | null)?.nama_divisi);
  const namaDivisiUnik = Array.from(
    new Set(
      proker
        .map((p) => (p.divisi as unknown as { nama_divisi: string } | null)?.nama_divisi)
        .filter((n): n is string => Boolean(n))
    )
  );

  const tabAktif = tab ?? "bersama";

  const daftarTab = [
    { key: "bersama", label: "Proker Bersama" },
    ...namaDivisiUnik.map((d) => ({ key: `divisi:${d}`, label: d })),
    { key: "kegiatan", label: "Kegiatan" },
  ];

  let items: ItemTimeline[] = [];

  if (tabAktif === "kegiatan") {
    items = kegiatan.map((k) => {
      const p = k.proker as unknown as { nama_proker: string } | null;
      return {
        id: k.id_kegiatan,
        judul: k.nama_kegiatan,
        subjudul: p?.nama_proker ? `Terkait: ${p.nama_proker}` : "Rapat umum",
        status: "Berjalan",
        tanggal_mulai: new Date(k.waktu_mulai).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
        href: `/dashboard/kegiatan/${k.id_kegiatan}`,
      };
    });
  } else if (tabAktif === "bersama") {
    items = prokerBersama.map((p) => ({
      id: p.id_proker,
      judul: p.nama_proker,
      subjudul: "Proker Bersama",
      status: p.status_proker,
      tanggal_mulai: p.tanggal_mulai,
      tanggal_selesai: p.tanggal_selesai,
      href: `/dashboard/proker/${p.id_proker}`,
    }));
  } else if (tabAktif.startsWith("divisi:")) {
    const namaDivisi = tabAktif.replace("divisi:", "");
    items = proker
      .filter((p) => (p.divisi as unknown as { nama_divisi: string } | null)?.nama_divisi === namaDivisi)
      .map((p) => ({
        id: p.id_proker,
        judul: p.nama_proker,
        subjudul: namaDivisi,
        status: p.status_proker,
        tanggal_mulai: p.tanggal_mulai,
        tanggal_selesai: p.tanggal_selesai,
        href: `/dashboard/proker/${p.id_proker}`,
      }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-paper-100">Timeline</h1>
        <p className="mt-1 text-sm text-paper-300">Periode {periodeAktif.nama_periode}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {daftarTab.map((t) => (
          <a
            key={t.key}
            href={`/dashboard/timeline?tab=${encodeURIComponent(t.key)}`}
            className={`rounded-md border px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.08em] ${
              tabAktif === t.key
                ? "border-signal-500 bg-signal-500/10 text-signal-400"
                : "border-ink-600 text-paper-300 hover:text-paper-100"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <TimelineVisual items={items} />
    </div>
  );
}
