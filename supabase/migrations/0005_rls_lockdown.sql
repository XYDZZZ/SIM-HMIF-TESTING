-- ============================================================
-- MIGRATION 0005: ROW LEVEL SECURITY (LOCKDOWN)
-- ============================================================
-- Prinsip: otorisasi granular (siapa boleh apa) sudah didesain di level
-- aplikasi (Next.js server actions), bukan lewat RLS policy per role yang
-- kompleks. Supaya klien browser TIDAK BISA sama sekali mengakses tabel
-- secara langsung (misal lewat anon key yang bocor), RLS diaktifkan di
-- semua tabel dengan TANPA policy untuk role anon/authenticated.
-- Hanya service_role (dipakai server Next.js) yang bisa baca/tulis,
-- dan service_role otomatis bypass RLS di Supabase/Postgres.
-- ============================================================

alter table periode enable row level security;
alter table users enable row level security;
alter table roles enable row level security;
alter table jabatan enable row level security;
alter table divisi enable row level security;
alter table anggota_periode enable row level security;
alter table proker enable row level security;
alter table dokumen_proker enable row level security;
alter table kegiatan enable row level security;
alter table absensi enable row level security;
alter table kas_transaksi enable row level security;
alter table tagihan_khusus enable row level security;
alter table mitra enable row level security;
alter table danus_katalog enable row level security;
alter table danus_stok enable row level security;
alter table produk_bahan enable row level security;
alter table danus_penjualan enable row level security;
alter table log_stok enable row level security;

-- Tidak ada CREATE POLICY sama sekali di sini secara sengaja.
-- Tanpa policy, anon & authenticated role otomatis DITOLAK total (default-deny).
-- service_role (dipakai server-side Next.js lewat SUPABASE_SERVICE_ROLE_KEY)
-- tetap bisa akses penuh karena secara desain Postgres/Supabase, service_role
-- selalu bypass RLS.
