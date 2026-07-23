"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrasiAnggota, type HasilAksi } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export default function HalamanRegistrasi() {
  const [state, formAction, pending] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => registrasiAnggota(formData),
    stateAwal
  );

  return (
    <AuthShell
      title="Daftar Akun Anggota"
      subtitle="Pendaftaran langsung aktif — tanpa perlu menunggu persetujuan."
    >
      <form action={formAction} className="space-y-4">
        <Field label="Nama Lengkap" name="nama_lengkap" required autoComplete="name" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="NIM" name="nim" required />
          <Field label="Angkatan" name="angkatan" placeholder="2024" required />
        </div>
        <Field
          label="Tahun Masuk HMIF"
          name="tahun_masuk_organisasi"
          placeholder="2024"
          required
        />
        <Field label="Nomor WhatsApp" name="nomor_whatsapp" placeholder="08xxxxxxxxxx" required />
        <PasswordField label="Password" name="password" required autoComplete="new-password" />

        {state.pesan && <Alert sukses={state.sukses} pesan={state.pesan} />}

        <Button type="submit" disabled={pending}>
          {pending ? "Memproses..." : "Daftar"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-paper-300">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-signal-400 hover:underline">
          Masuk di sini
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-paper-300">
        Mendaftar sebagai Mitra UMKM?{" "}
        <Link href="/registrasi-mitra" className="text-signal-400 hover:underline">
          Klik di sini
        </Link>
      </p>
    </AuthShell>
  );
}
