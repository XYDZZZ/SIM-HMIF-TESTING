-- ============================================================
-- MIGRATION 0010: PENYESUAIAN SKEMA SURAT SESUAI PANDUAN RESMI
-- ============================================================
-- Berdasarkan "Tata Cara Penulisan Nomor Surat HMIF" dari Sekretaris:
--   - Surat Kepengurusan: XXX/KODE/HMIF-UNPERBA/ROMAWI/TAHUN
--     (nomor urut reset di awal tiap periode kepengurusan)
--   - Surat Kepanitiaan : XXX/KODE/PANPEL/KODE-KEGIATAN/ROMAWI/TAHUN
--     (nomor urut terpisah per kegiatan/kepanitiaan, bukan per periode)

alter table surat add column kategori_penerbit varchar(20); -- 'Kepengurusan' / 'Kepanitiaan', hanya utk jenis Keluar
alter table surat add column kode_jenis_surat varchar(10);  -- UND/SP/ST/SK/SM/BA/PMB/SR/SB
alter table surat add column kode_kegiatan varchar(30);     -- mis. "MUBES", hanya utk kategori Kepanitiaan

alter table surat add constraint chk_kategori_penerbit
  check (kategori_penerbit is null or kategori_penerbit in ('Kepengurusan', 'Kepanitiaan'));
