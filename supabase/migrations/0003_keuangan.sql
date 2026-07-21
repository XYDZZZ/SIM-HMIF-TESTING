-- ============================================================
-- MIGRATION 0003: KEUANGAN (KAS & TAGIHAN KHUSUS)
-- ============================================================

-- ------------------------------------------------------------
-- TABEL: tagihan_khusus (dibuat lebih dulu karena dirujuk kas_transaksi)
-- ------------------------------------------------------------
create table tagihan_khusus (
  id_tagihan      uuid primary key default gen_random_uuid(),
  nama_tagihan    varchar(150) not null,   -- mis. "Iuran Malam Keakraban"
  nominal         numeric(12,2) not null,
  id_periode      uuid not null references periode(id_periode),
  id_kegiatan     uuid references kegiatan(id_kegiatan), -- opsional, link ke acara terkait
  deadline        date,
  dibuat_oleh     uuid not null references users(id_user), -- harus role Bendahara
  dibuat_pada     timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_tagihan_khusus_periode on tagihan_khusus(id_periode);

-- ------------------------------------------------------------
-- TABEL: kas_transaksi
-- ------------------------------------------------------------
create table kas_transaksi (
  id_transaksi        uuid primary key default gen_random_uuid(),
  id_user             uuid not null references users(id_user), -- pemilik/pembayar
  jenis                varchar(10) not null,   -- Masuk / Keluar
  kategori             varchar(30) not null,   -- Kas Rutin / Kas Danus / Kas Tagihan Khusus
  id_tagihan           uuid references tagihan_khusus(id_tagihan),
  id_penjualan         uuid,  -- FK ditambahkan belakangan setelah tabel danus_penjualan dibuat (lihat migration 0004)
  nominal              numeric(12,2) not null,
  metode_pembayaran    varchar(20),  -- Transfer / Tunai, NULL untuk entri Keluar/Danus otomatis
  bukti_url            text,         -- wajib utk Transfer, boleh kosong utk Tunai
  status               varchar(20) not null default 'Pending', -- Pending / Lunas / Ditolak
  sumber_transaksi     varchar(20) not null default 'Manual',  -- Manual / Otomatis-Danus
  diverifikasi_oleh    uuid references users(id_user), -- harus role Bendahara
  diverifikasi_pada    timestamptz,
  dibuat_pada          timestamptz not null default now(),
  deleted_at           timestamptz,

  constraint chk_jenis check (jenis in ('Masuk', 'Keluar')),
  constraint chk_kategori check (kategori in ('Kas Rutin', 'Kas Danus', 'Kas Tagihan Khusus')),
  constraint chk_status check (status in ('Pending', 'Lunas', 'Ditolak')),
  constraint chk_sumber check (sumber_transaksi in ('Manual', 'Otomatis-Danus')),
  constraint chk_metode_pembayaran check (
    metode_pembayaran is null or metode_pembayaran in ('Transfer', 'Tunai')
  )
);

create index idx_kas_transaksi_user on kas_transaksi(id_user);
create index idx_kas_transaksi_kategori on kas_transaksi(kategori);
create index idx_kas_transaksi_status on kas_transaksi(status);

comment on column kas_transaksi.sumber_transaksi is 'Otomatis-Danus = baris ini diinsert sistem otomatis saat Mitra transaksi, bukan input manual Bendahara.';
