"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { buatTagihanKhusus } from "@/lib/actions/kas";
import type { HasilAksi } from "@/lib/actions/auth";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export function FormTagihanKhusus({ id_periode }: { id_periode: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await buatTagihanKhusus(formData);
      if (hasil.sukses) router.refresh();
      return hasil;
    },
    stateAwal
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id_periode" value={id_periode} />
      <Field label="Nama Tagihan" name="nama_tagihan" required placeholder="Iuran Malam Keakraban" />
      <Field label="Nominal (Rp)" name="nominal" type="number" required />
      <Field label="Deadline" name="deadline" type="date" />
      {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}
      <Button type="submit" disabled={pending} className="w-auto px-5">
        {pending ? "Menyimpan..." : "Buat Tagihan"}
      </Button>
    </form>
  );
}
