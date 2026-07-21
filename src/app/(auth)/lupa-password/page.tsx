"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifikasiLupaPassword, setPasswordBaru } from "@/lib/actions/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function HalamanLupaPassword() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [dataTerverifikasi, setDataTerverifikasi] = useState({ nim: "", nama_lengkap: "" });
  const [pesan, setPesan] = useState<{ sukses: boolean; teks: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function tanganiLangkah1(formData: FormData) {
    setPending(true);
    const hasil = await verifikasiLupaPassword(formData);
    setPending(false);
    setPesan({ sukses: hasil.sukses, teks: hasil.pesan });
    if (hasil.sukses) {
      setDataTerverifikasi({
        nim: formData.get("nim") as string,
        nama_lengkap: formData.get("nama_lengkap") as string,
      });
      setLangkah(2);
    }
  }

  async function tanganiLangkah2(formData: FormData) {
    formData.set("nim", dataTerverifikasi.nim);
    formData.set("nama_lengkap", dataTerverifikasi.nama_lengkap);
    setPending(true);
    const hasil = await setPasswordBaru(formData);
    setPending(false);
    setPesan({ sukses: hasil.sukses, teks: hasil.pesan });
    if (hasil.sukses) {
      setTimeout(() => router.push("/login"), 1200);
    }
  }

  return (
    <AuthShell
      title="Lupa Password"
      subtitle={
        langkah === 1
          ? "Masukkan NIM dan nama lengkap sesuai data pendaftaran."
          : "Buat password baru untuk akun Anda."
      }
    >
      {langkah === 1 ? (
        <form action={tanganiLangkah1} className="space-y-4">
          <Field label="NIM" name="nim" required autoFocus />
          <Field label="Nama Lengkap" name="nama_lengkap" required />
          {pesan && <Alert sukses={pesan.sukses} pesan={pesan.teks} />}
          <Button type="submit" disabled={pending}>
            {pending ? "Memeriksa..." : "Verifikasi"}
          </Button>
        </form>
      ) : (
        <form action={tanganiLangkah2} className="space-y-4">
          <Field
            label="Password Baru"
            name="password_baru"
            type="password"
            required
            autoFocus
            autoComplete="new-password"
          />
          {pesan && <Alert sukses={pesan.sukses} pesan={pesan.teks} />}
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-paper-300">
        <Link href="/login" className="text-signal-400 hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </AuthShell>
  );
}
