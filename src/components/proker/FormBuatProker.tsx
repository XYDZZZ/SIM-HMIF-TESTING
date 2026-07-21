"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { buatProker } from "@/lib/actions/proker";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

interface Opsi {
  id: string;
  label: string;
}

export function FormBuatProker({
  id_periode,
  mode,
  divisiTetap,
  opsiDivisi,
}: {
  id_periode: string;
  mode: "bersama" | "divisi-tetap" | "pilih-bebas";
  divisiTetap?: Opsi;
  opsiDivisi?: Opsi[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await buatProker(formData);
      if (hasil.sukses) router.push("/dashboard/proker");
      return hasil;
    },
    stateAwal
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_periode" value={id_periode} />

      <Field label="Nama Proker" name="nama_proker" required autoFocus />

      {mode === "bersama" && (
        <p className="rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-paper-300">
          Proker Bersama — terlihat oleh semua divisi
        </p>
      )}

      {mode === "divisi-tetap" && divisiTetap && (
        <>
          <input type="hidden" name="id_divisi" value={divisiTetap.id} />
          <p className="rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-paper-300">
            Divisi: {divisiTetap.label}
          </p>
        </>
      )}

      {mode === "pilih-bebas" && (
        <label className="block">
          <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
            Divisi (kosongkan untuk Proker Bersama)
          </span>
          <select
            name="id_divisi"
            className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
          >
            <option value="">Proker Bersama</option>
            {opsiDivisi?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal Mulai" name="tanggal_mulai" type="date" />
        <Field label="Tanggal Selesai" name="tanggal_selesai" type="date" />
      </div>

      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Deskripsi
        </span>
        <textarea
          name="deskripsi"
          rows={3}
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        />
      </label>

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Buat Proker"}
      </Button>
    </form>
  );
}
