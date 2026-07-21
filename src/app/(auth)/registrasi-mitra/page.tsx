"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrasiMitra } from "@/lib/actions/mitra-auth";
import type { HasilAksi } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export default function HalamanRegistrasiMitra() {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => registrasiMitra(formData),
    stateAwal
  );

  return (
    <AuthShell
      title="Daftar Mitra UMKM"
      subtitle="Akun aktif setelah disetujui pengurus (biasanya dibahas dalam rapat internal)."
    >
      <form action={formAction} className="space-y-4">
        <Field label="Nama Usaha" name="nama_usaha" required autoFocus />
        <Field label="Nama Pemilik" name="nama_pemilik" required />
        <Field label="Nomor WhatsApp" name="kontak_whatsapp" placeholder="08xxxxxxxxxx" required />
        <Field label="Username" name="username" required />
        <Field label="Password" name="password" type="password" required autoComplete="new-password" />

        {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

        <Button type="submit" disabled={pending}>
          {pending ? "Mengirim..." : "Kirim Pendaftaran"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-paper-300">
        Sudah disetujui sebagai mitra?{" "}
        <Link href="/login" className="text-signal-400 hover:underline">
          Masuk di sini
        </Link>
      </p>
    </AuthShell>
  );
}
