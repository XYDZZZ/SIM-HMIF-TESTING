# SIM HIMATIF

Sistem Informasi Manajemen Himpunan Mahasiswa Informatika — Next.js + Supabase (PostgreSQL).

## Status Pengembangan

**Sudah selesai (bisa langsung dites):**
- Skema database lengkap (18 tabel + 5 file migration) dengan seluruh constraint, index, dan 2 function inti (`proses_transaksi_danus`, `batalkan_transaksi_danus`)
- Row Level Security lockdown (akses data hanya lewat server, bukan langsung dari browser)
- Autentikasi penuh: registrasi anggota (langsung aktif), registrasi Mitra (butuh ACC), login (NIM+password untuk anggota, username+password untuk Mitra), lupa password self-service, logout
- Modul otorisasi (`authorize.ts`) yang mengimplementasikan seluruh matriks hak akses (Superadmin/BPH per jabatan/Kadiv/Anggota/Mitra)
- Manajemen Periode: buka periode pertama, "Akhiri Periode & Buka Periode Baru" (Superadmin), assign massal carry-forward dari periode sebelumnya, assign anggota baru, halaman profil per-anggota dengan poin keaktifan live
- Proker: CRUD dengan guard per-divisi (Kadiv) / bersama (BPH), status, dokumen (link Google Drive)
- Kegiatan: CRUD khusus BPH, bobot poin yang bisa diubah kapan saja
- Absensi: mode scan QR via kamera browser (webcam/HP), validasi telat/tepat waktu otomatis, cegah dobel-absen, input manual (backup + Izin/Sakit)
- Kas & Tagihan Khusus: dashboard transparan (semua anggota bisa lihat, filter per kategori), pengajuan pembayaran (transfer + bukti), input tunai & pengeluaran oleh Bendahara, verifikasi (Lunas/Ditolak), ringkasan saldo real-time
- Portal Mitra: katalog produk (dengan toggle status), stok bahan baku + restock, resep produk (multi-bahan), transaksi (lewat RPC atomik — hitung margin, potong stok tanpa blokir, sinkron otomatis ke Kas Danus), pembatalan transaksi (rollback stok + kas), cetak struk (print browser, bukan kirim WhatsApp)
- Oversight Danus: Ketua/Waketu bisa ACC/Tolak pendaftaran mitra; Ketua/Waketu/Sekretaris/Bendahara bisa lihat read-only seluruh katalog/stok/transaksi tiap mitra
- Middleware proteksi rute
- Identitas visual dasar (tema warna, tipografi, komponen UI dasar) yang dipakai konsisten di seluruh halaman

**Belum dikerjakan (modul selanjutnya):**
- Cetak ID Card / kirim ulang foto QR
- Laporan keaktifan & rekap LPJ (lintas periode / ekspor)

---

## 1. Menyiapkan Supabase (gratis, tanpa kartu kredit)

1. Buat akun & project baru di supabase.com (pilih region Singapore agar latensi rendah dari Indonesia).
2. Buka **SQL Editor** di dashboard Supabase, jalankan file-file berikut **berurutan** (satu per satu, tunggu sampai sukses baru lanjut):
   ```
   supabase/migrations/0001_administrasi_keanggotaan.sql
   supabase/migrations/0002_proker_kegiatan_absensi.sql
   supabase/migrations/0003_keuangan.sql
   supabase/migrations/0004_danus_mitra.sql
   supabase/migrations/0005_rls_lockdown.sql
   supabase/migrations/0006_kas_keterangan.sql
   ```
3. Buka `supabase/seed_superadmin.sql`, **ganti semua nilai placeholder** (NIM, nama, password awal, dll), lalu jalankan di SQL Editor. Ini membuat periode pertama + akun Superadmin (kamu).
4. Ambil kredensial di **Project Settings -> API**:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` (klik "reveal") -> `SUPABASE_SERVICE_ROLE_KEY` -- **rahasiakan, jangan pernah commit ke Git**

## 2. Menjalankan di lokal

```bash
cp .env.example .env.local
# lalu isi .env.local dengan kredensial Supabase di atas
# untuk SESSION_SECRET, generate string acak, misal:
openssl rand -base64 32

npm install
npm run dev
```

Buka `http://localhost:3000`, login pakai NIM & password yang dibuat di `seed_superadmin.sql`.

## 3. Deploy gratis ke Vercel

1. Push project ini ke repository GitHub.
2. Buka vercel.com -> New Project -> import repo tersebut.
3. Di bagian Environment Variables, isi 4 variabel yang sama seperti di `.env.local`.
4. Deploy. Vercel Hobby plan gratis selamanya, tanpa kartu kredit.

**Catatan:** project Supabase gratis akan "tidur" otomatis kalau tidak ada aktivitas selama 7 hari berturut-turut. Karena sistem ini dipakai rutin untuk absensi/kas, kemungkinan besar ini tidak akan jadi masalah. Kalau nanti tetap ingin dijaga tetap aktif, bisa ditambahkan cron job gratis (GitHub Actions) yang melakukan ping ringan setiap beberapa hari.

## Struktur Folder Penting

```
supabase/migrations/          -- seluruh skema database (jalankan berurutan)
supabase/seed_superadmin.sql
src/lib/supabase/server.ts    -- satu-satunya jalur koneksi ke database
src/lib/auth/                 -- session, password hashing, otorisasi
src/lib/actions/              -- server actions (mutasi data)
src/lib/validations/          -- skema validasi Zod
src/components/ui/            -- komponen dasar (Field, Button, Alert)
src/app/(auth)/               -- halaman registrasi, login, lupa password
src/app/dashboard/            -- area anggota (setelah login)
src/app/mitra/                -- area Mitra (setelah login)
```
