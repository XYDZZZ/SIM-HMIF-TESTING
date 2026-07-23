"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { inputPengeluaran } from "@/lib/actions/kas";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { FileField } from "@/components/ui/FileField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormPengeluaran() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await inputPengeluaran(formData);
      if (hasil.sukses) router.push("/dashboard/kas");
      return hasil;
    },
    stateAwal
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nominal (Rp)" name="nominal" type="number" required />
      <Field label="Keterangan" name="keterangan" required placeholder="Beli spanduk Proker X" />
      <FileField label="Foto Nota/Bukti (opsional)" name="bukti_file" />
      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}
      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Catat Pengeluaran"}
      </Button>
    </form>
  );
}
