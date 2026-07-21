"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { assignAnggotaPeriode } from "@/lib/actions/periode";
import type { HasilAksi } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

interface Opsi {
  id: string;
  label: string;
}

export function FormAssignSatuan({
  id_periode,
  calonAnggota,
  roles,
  jabatan,
  divisi,
}: {
  id_periode: string;
  calonAnggota: Array<{ id_user: string; nim: string; nama_lengkap: string }>;
  roles: Opsi[];
  jabatan: Opsi[];
  divisi: Opsi[];
}) {
  const router = useRouter();
  const [namaRoleTerpilih, setNamaRoleTerpilih] = useState<string>("");

  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await assignAnggotaPeriode(formData);
      if (hasil.sukses) router.refresh();
      return hasil;
    },
    stateAwal
  );

  if (calonAnggota.length === 0) {
    return <p className="text-sm text-paper-300">Semua anggota terdaftar sudah masuk periode ini.</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_periode" value={id_periode} />

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Pilih Anggota
        </span>
        <select
          name="id_user"
          required
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          <option value="">-- pilih --</option>
          {calonAnggota.map((a) => (
            <option key={a.id_user} value={a.id_user}>
              {a.nama_lengkap} ({a.nim})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Role
        </span>
        <select
          name="id_role"
          required
          onChange={(e) => {
            const label = e.target.selectedOptions[0]?.dataset.label ?? "";
            setNamaRoleTerpilih(label);
          }}
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          <option value="">-- pilih --</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id} data-label={r.label}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      {namaRoleTerpilih === "BPH" && (
        <label className="block">
          <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
            Jabatan
          </span>
          <select
            name="id_jabatan"
            required
            className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
          >
            <option value="">-- pilih --</option>
            {jabatan.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {(namaRoleTerpilih === "Kadiv" || namaRoleTerpilih === "Anggota") && (
        <label className="block">
          <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
            Divisi
          </span>
          <select
            name="id_divisi"
            required
            className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
          >
            <option value="">-- pilih --</option>
            {divisi.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menambahkan..." : "Tambahkan ke Periode Ini"}
      </Button>
    </form>
  );
}
