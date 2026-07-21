import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "himatif_session";

const RUTE_AUTH = ["/login", "/registrasi", "/registrasi-mitra", "/lupa-password"];

function getSecretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

async function bacaSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { id: string; tipe: "anggota" | "mitra"; nama: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await bacaSession(request);

  const adalahRuteAuth = RUTE_AUTH.some((r) => pathname.startsWith(r));

  // Sudah login tapi buka halaman auth -> lempar ke area masing-masing
  if (session && adalahRuteAuth) {
    const tujuan = session.tipe === "mitra" ? "/mitra" : "/dashboard";
    return NextResponse.redirect(new URL(tujuan, request.url));
  }

  // Belum login tapi buka halaman terproteksi -> lempar ke login
  const perluLogin = pathname.startsWith("/dashboard") || pathname.startsWith("/mitra");
  if (!session && perluLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Anggota (bukan mitra) tidak boleh masuk area /mitra, dan sebaliknya
  if (session && pathname.startsWith("/mitra") && session.tipe !== "mitra") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (session && pathname.startsWith("/dashboard") && session.tipe !== "anggota") {
    return NextResponse.redirect(new URL("/mitra", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/mitra/:path*", "/login", "/registrasi", "/registrasi-mitra", "/lupa-password"],
};
