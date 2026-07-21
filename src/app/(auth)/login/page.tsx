"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAnggota, type HasilAksi } from "@/lib/actions/auth";
import { loginMitra } from "@/lib/actions/mitra-auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const stateAwal: HasilAksi = { sukses: false, pesan: "" };

export default function HalamanLogin() {
  const [tab, setTab] = useState<"anggota" | "mitra">("anggota");
  const router = useRouter();

  const [stateAnggota, formActionAnggota, pendingAnggota] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await loginAnggota(formData);
      if (hasil.sukses) router.push("/dashboard");
      return hasil;
    },
    stateAwal
  );

  const [stateMitra, formActionMitra, pendingMitra] = useActionState(
    async (_prev: HasilAksi, formData: FormData) => {
      const hasil = await loginMitra(formData);
      if (hasil.sukses) router.push("/mitra");
      return hasil;
    },
    stateAwal
  );

  return (
    <AuthShell title="Masuk" subtitle="Masuk menggunakan akun yang sudah terdaftar.">
      <div className="mb-6 grid grid-cols-2 rounded-md border border-ink-600 p-1">
        {(["anggota", "mitra"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded py-1.5 font-display text-[11px] uppercase tracking-[0.12em] transition-colors ${
              tab === t ? "bg-signal-500 text-ink-950" : "text-paper-300 hover:text-paper-100"
            }`}
          >
            {t === "anggota" ? "Anggota" : "Mitra"}
          </button>
        ))}
      </div>

      {tab === "anggota" ? (
        <form action={formActionAnggota} className="space-y-4">
          <Field label="NIM" name="nim" required autoFocus />
          <Field label="Password" name="password" type="password" required autoComplete="current-password" />
          {stateAnggota.pesan && <Alert sukses={stateAnggota.sukses} pesan={stateAnggota.pesan} />}
          <Button type="submit" disabled={pendingAnggota}>
            {pendingAnggota ? "Memproses..." : "Masuk"}
          </Button>
          <p className="text-center text-sm text-paper-300">
            <Link href="/lupa-password" className="text-signal-400 hover:underline">
              Lupa password?
            </Link>
          </p>
        </form>
      ) : (
        <form action={formActionMitra} className="space-y-4">
          <Field label="Username" name="username" required autoFocus />
          <Field label="Password" name="password" type="password" required autoComplete="current-password" />
          {stateMitra.pesan && <Alert sukses={stateMitra.sukses} pesan={stateMitra.pesan} />}
          <Button type="submit" disabled={pendingMitra}>
            {pendingMitra ? "Memproses..." : "Masuk sebagai Mitra"}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-paper-300">
        Belum punya akun?{" "}
        <Link href="/registrasi" className="text-signal-400 hover:underline">
          Daftar di sini
        </Link>
      </p>
    </AuthShell>
  );
}
