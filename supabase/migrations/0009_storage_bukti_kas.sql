-- ============================================================
-- MIGRATION 0009: STORAGE BUCKET UNTUK BUKTI KAS
-- ============================================================
-- Bucket privat -- akses hanya lewat server (service_role, yang otomatis
-- bypass RLS storage), sama seperti seluruh tabel lain di sistem ini.
-- File diorganisir per kategori lewat prefix folder saat upload
-- (kas-rutin/, kas-tagihan-khusus/, pengeluaran/), bukan lewat bucket terpisah,
-- supaya tetap satu bucket sederhana untuk dikelola.

insert into storage.buckets (id, name, public)
values ('bukti-kas', 'bukti-kas', false)
on conflict (id) do nothing;
