-- ============================================================
-- MIGRATION 0006: TAMBAHAN KOLOM KETERANGAN DI KAS_TRANSAKSI
-- ============================================================
-- Ditemukan saat implementasi modul Kas: pengeluaran (jenis='Keluar')
-- butuh keterangan singkat (mis. "Beli spanduk proker X"), yang belum
-- terwadahi kolom manapun sebelumnya.

alter table kas_transaksi add column keterangan text;
