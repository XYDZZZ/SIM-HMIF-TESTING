import Link from "next/link";
import { notFound } from "next/navigation";
import { detailProker, daftarPanitia, daftarAnggotaUntukPanitia } from "@/lib/actions/proker";
import { SelectorStatusProker } from "@/components/proker/SelectorStatusProker";
import { FormTambahDokumen } from "@/components/proker/FormTambahDokumen";
import { FormTambahPanitia } from "@/components/proker/FormTambahPanitia";
import { TombolHapusPanitia } from "@/components/proker/TombolHapusPanitia";

export default async function HalamanDetailProker({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { proker, dokumen } = await detailProker(id);
  if (!proker) notFound();

  const divisiObj = proker.divisi as unknown as { nama_divisi: string } | null;
  const periodeObj = proker.periode as unknown as { status_aktif: boolean } | null;

  const [panitia, calonPanitia] = await Promise.all([
    daftarPanitia(id),
    daftarAnggotaUntukPanitia(proker.id_periode),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/proker" className="text-sm text-signal-400 hover:underline">
        &larr; Program Kerja
      </Link>

      <div className="rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-paper-100">{proker.nama_proker}</h1>
            <p className="mt-1 text-sm text-paper-300">{divisiObj?.nama_divisi ?? "Proker Bersama"}</p>
          </div>
          {periodeObj?.status_aktif ? (
            <SelectorStatusProker id_proker={proker.id_proker} statusSaatIni={proker.status_proker} />
          ) : (
            <span className="text-xs text-paper-300">Periode terkunci — status tidak bisa diubah</span>
          )}
        </div>

        {proker.deskripsi && <p className="mt-4 text-sm text-paper-100">{proker.deskripsi}</p>}

        <div className="mt-4 flex gap-6 text-sm text-paper-300">
          {proker.tanggal_mulai && <span>Mulai: {proker.tanggal_mulai}</span>}
          {proker.tanggal_selesai && <span>Selesai: {proker.tanggal_selesai}</span>}
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
            Struktur Kepanitiaan ({panitia.length})
          </h2>
        </div>

        <div className="space-y-2">
          {panitia.map((p) => {
            const u = p.users as unknown as { nama_lengkap: string; nim: string };
            return (
              <div
                key={p.id_panitia}
                className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-3 text-sm"
              >
                <div>
                  <span className="text-paper-100">{u?.nama_lengkap}</span>
                  <span className="ml-2 text-paper-300">{p.peran}</span>
                </div>
                {periodeObj?.status_aktif && <TombolHapusPanitia id_panitia={p.id_panitia} id_proker={id} />}
              </div>
            );
          })}
          {panitia.length === 0 && <p className="text-sm text-paper-300">Belum ada panitia ditetapkan.</p>}
        </div>

        {periodeObj?.status_aktif && (
          <div className="mt-3">
            <FormTambahPanitia
              id_proker={id}
              daftarAnggota={calonPanitia.map((a) => {
                const u = a.users as unknown as { nama_lengkap: string; nim: string };
                return { id_user: a.id_user, nama_lengkap: u?.nama_lengkap, nim: u?.nim };
              })}
            />
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[12px] uppercase tracking-[0.14em] text-paper-300">
            Dokumen ({dokumen.length})
          </h2>
          {periodeObj?.status_aktif && <FormTambahDokumen id_proker={proker.id_proker} />}
        </div>

        <div className="space-y-2">
          {dokumen.map((d) => (
            <a
              key={d.id_dokumen}
              href={d.url_dokumen}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-3 text-sm hover:border-signal-500/50"
            >
              <span className="text-paper-100">{d.nama_dokumen}</span>
              <span className="font-display text-[10px] uppercase tracking-[0.1em] text-paper-300">
                {d.jenis_dokumen}
              </span>
            </a>
          ))}
          {dokumen.length === 0 && <p className="text-sm text-paper-300">Belum ada dokumen.</p>}
        </div>
      </section>
    </div>
  );
}
