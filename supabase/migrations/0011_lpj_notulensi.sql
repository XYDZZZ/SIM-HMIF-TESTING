-- ============================================================
-- MIGRATION 0011: LPJ PROKER + NOTULENSI/EVALUASI KEGIATAN
-- ============================================================

-- LPJ (Laporan Pertanggungjawaban) per proker -- diisi setelah proker Selesai,
-- supaya penyusunan LPJ periode tidak dikerjakan dari nol di akhir kepengurusan.
alter table proker add column lpj_ringkasan text;
alter table proker add column lpj_kendala text;
alter table proker add column lpj_rekomendasi text;
alter table proker add column lpj_url_dokumen text;
alter table proker add column lpj_diisi_oleh uuid references users(id_user);
alter table proker add column lpj_diisi_pada timestamptz;

-- Notulensi & evaluasi per kegiatan (rapat/acara)
alter table kegiatan add column notulensi text;
alter table kegiatan add column evaluasi text;
