import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Beranda() {
  const session = await getSession();

  if (!session) redirect("/login");
  redirect(session.tipe === "mitra" ? "/mitra" : "/dashboard");
}
