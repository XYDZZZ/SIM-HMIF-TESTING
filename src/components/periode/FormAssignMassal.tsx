"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignMassalPeriode } from "@/lib/actions/periode";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface Opsi {
  id: string;
  label: string;
}

interface CalonMassal {
  id_user: string;
  nim: string;
  nama_lengkap: string;
  nama_role_lama: string | null;
  nama_jabatan_lama: string | null;
  nama_divisi_lama: string | null;
}

interface BarisState {
  dicentang: boolean;
  id_role: string;
  namaRole: string;
  id_jabatan: string;
  id_divisi: string;
}

export function FormAssignMassal({
  id_periode_baru,
  namaPeriodeLama,
  calon,
  roles,
  jabatan,
  divisi,
}: {
  id_periode_baru: string;
  namaPeriodeLama: string;
  calon: CalonMassal[];
  roles: Opsi[];
  jabatan: Opsi[];
  divisi: Opsi[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null);

  const roleIdByLabel = (label: string | null) => roles.find((r) => r.label === label)?.id ?? "";

  const [baris, setBaris] = useState<Record<string, BarisState>>(() =>
    Object.fromEntries(
      calon.map((c) => [
        c.id_user,
        {
          dicentang: false,
          id_role: roleIdByLabel(c.nama_role_lama),
          namaRole: c.nama_role_lama ?? "",
          id_jabatan: jabatan.find((j) => j.label === c.nama_jabatan_lama)?.id ?? "",
          id_divisi: divisi.find((d) => d.label === c.nama_divisi_lama)?.id ?? "",
        },
      ])
    )
  );

  function updateBaris(id_user: string, patch: Partial<BarisState>) {
    setBaris((prev) => ({ ...prev, [id_user]: { ...prev[id_user], ...patch } }));
  }

  function submit() {
    const penugasan = Object.entries(baris)
      .filter(([, b]) => b.dicentang)
      .map(([id_user, b]) => ({
        id_user,
        id_role: b.id_role,
        id_jabatan: b.namaRole === "BPH" ? b.id_jabatan || null : null,
        id_divisi: b.namaRole === "Kadiv" || b.namaRole === "Anggota" ? b.id_divisi || null : null,
      }));

    startTransition(async () => {
      const hasil = await assignMassalPeriode(id_periode_baru, penugasan);
      setPesan({ sukses: hasil.sukses, teks: hasil.pesan });
      if (hasil.sukses) router.refresh();
    });
  }

  if (calon.length === 0) {
    return (
      <p className="text-sm text-paper-300">
        Tidak ada anggota dari periode sebelumnya yang belum dipindahkan.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-paper-300">
        Menampilkan anggota dari periode <span className="text-paper-100">{namaPeriodeLama}</span>. Centang
        yang ingin dilanjutkan, sesuaikan role/jabatan/divisinya bila perlu.
      </p>

      <div className="overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left font-display text-[11px] uppercase tracking-[0.1em] text-paper-300">
            <tr>
              <th className="px-3 py-2.5"></th>
              <th className="px-3 py-2.5">Nama</th>
              <th className="px-3 py-2.5">Role</th>
              <th className="px-3 py-2.5">Jabatan / Divisi</th>
            </tr>
          </thead>
          <tbody>
            {calon.map((c) => {
              const b = baris[c.id_user];
              return (
                <tr key={c.id_user} className="border-t border-ink-700">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={b.dicentang}
                      onChange={(e) => updateBaris(c.id_user, { dicentang: e.target.checked })}
                      className="h-4 w-4 accent-[var(--color-signal-500)]"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-paper-100">
                    {c.nama_lengkap} <span className="text-paper-300">({c.nim})</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={b.id_role}
                      onChange={(e) => {
                        const label = e.target.selectedOptions[0]?.dataset.label ?? "";
                        updateBaris(c.id_user, { id_role: e.target.value, namaRole: label });
                      }}
                      className="rounded border border-ink-600 bg-ink-900 px-2 py-1.5 text-paper-100 outline-none focus:border-signal-500"
                    >
                      <option value="">--</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id} data-label={r.label}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    {b.namaRole === "BPH" && (
                      <select
                        value={b.id_jabatan}
                        onChange={(e) => updateBaris(c.id_user, { id_jabatan: e.target.value })}
                        className="rounded border border-ink-600 bg-ink-900 px-2 py-1.5 text-paper-100 outline-none focus:border-signal-500"
                      >
                        <option value="">--</option>
                        {jabatan.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {(b.namaRole === "Kadiv" || b.namaRole === "Anggota") && (
                      <select
                        value={b.id_divisi}
                        onChange={(e) => updateBaris(c.id_user, { id_divisi: e.target.value })}
                        className="rounded border border-ink-600 bg-ink-900 px-2 py-1.5 text-paper-100 outline-none focus:border-signal-500"
                      >
                        <option value="">--</option>
                        {divisi.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pesan && <Alert sukses={pesan.sukses} pesan={pesan.teks} />}

      <Button onClick={submit} disabled={pending} className="w-auto px-5">
        {pending ? "Memindahkan..." : "Pindahkan yang Dicentang"}
      </Button>
    </div>
  );
}
