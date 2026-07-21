"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/lib/actions/pengguna";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormEditUser({
  user,
}: {
  user: { id_user: string; nama_lengkap: string; nim: string; angkatan: string | null; nomor_whatsapp: string | null; status: string };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await updateUser(formData);
      if (hasil.sukses) router.refresh();
      return hasil;
    },
    stateAwal
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_user" value={user.id_user} />
      <Field label="Nama Lengkap" name="nama_lengkap" defaultValue={user.nama_lengkap} required />
      <Field label="NIM" name="nim" defaultValue={user.nim} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Angkatan" name="angkatan" defaultValue={user.angkatan ?? ""} />
        <Field label="Nomor WhatsApp" name="nomor_whatsapp" defaultValue={user.nomor_whatsapp ?? ""} />
      </div>
      <label className="block">
        <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
          Status Akun
        </span>
        <select
          name="status"
          defaultValue={user.status}
          className="w-full rounded-md border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-[15px] text-paper-100 outline-none focus:border-signal-500"
        >
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
      </label>

      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
