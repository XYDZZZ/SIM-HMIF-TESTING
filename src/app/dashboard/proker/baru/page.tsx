import { redirect } from "next/navigation";
import Link from "next/link";
import { getKonteksPengguna } from "@/lib/auth/authorize";
import { getPeriodeAktif } from "@/lib/actions/periode";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FormBuatProker } from "@/components/proker/FormBuatProker";

export default async function HalamanBuatProker() {
  const konteks = await getKonteksPengguna();
  if (!konteks || konteks.tipe !== "anggota") redirect("/login");

  const periodeAktif = await getPeriodeAktif();
  if (!periodeAktif) {
    return <p className="text-sm text-paper-300">Belum ada periode aktif.</p>;
  }

  const bolehBuatBersama = konteks.is_superadmin || konteks.nama_role === "BPH";
  const bolehBuatDivisi = konteks.is_superadmin || (konteks.nama_role === "Kadiv" && konteks.id_divisi);

  if (!bolehBuatBersama && !bolehBuatDivisi) {
    return <p className="text-sm text-paper-300">Anda tidak memiliki hak untuk membuat proker.</p>;
  }

  let mode: "bersama" | "divisi-tetap" | "pilih-bebas" = "bersama";
  let divisiTetap: { id: string; label: string } | undefined;
  let opsiDivisi: { id: string; label: string }[] | undefined;

  if (konteks.is_superadmin) {
    mode = "pilih-bebas";
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.from("divisi").select("id_divisi, nama_divisi");
    opsiDivisi = (data ?? []).map((d) => ({ id: d.id_divisi, label: d.nama_divisi }));
  } else if (konteks.nama_role === "Kadiv" && konteks.id_divisi) {
    mode = "divisi-tetap";
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.from("divisi").select("nama_divisi").eq("id_divisi", konteks.id_divisi).single();
    divisiTetap = { id: konteks.id_divisi, label: data?.nama_divisi ?? "" };
  } else {
    mode = "bersama";
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/proker" className="text-sm text-signal-400 hover:underline">
        &larr; Program Kerja
      </Link>
      <h1 className="font-display text-2xl text-paper-100">Buat Proker Baru</h1>

      <div className="max-w-lg rounded-xl border border-ink-700 bg-ink-900/60 p-7">
        <FormBuatProker
          id_periode={periodeAktif.id_periode}
          mode={mode}
          divisiTetap={divisiTetap}
          opsiDivisi={opsiDivisi}
        />
      </div>
    </div>
  );
}
