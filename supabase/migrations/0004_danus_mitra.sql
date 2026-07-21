-- ============================================================
-- MIGRATION 0004: KEMITRAAN / DANUS
-- ============================================================

-- ------------------------------------------------------------
-- TABEL: mitra (entitas eksternal, login terpisah dari users)
-- ------------------------------------------------------------
create table mitra (
  id_mitra            uuid primary key default gen_random_uuid(),
  nama_usaha          varchar(150) not null,
  nama_pemilik        varchar(150) not null,
  kontak_whatsapp     varchar(20),
  username            varchar(50) not null,
  password_hash       text not null,
  status_pendaftaran  varchar(20) not null default 'Menunggu', -- Menunggu/Disetujui/Ditolak
  diproses_oleh       uuid references users(id_user), -- Ketua/Waketu/Superadmin
  diproses_pada       timestamptz,
  dibuat_pada         timestamptz not null default now(),
  deleted_at          timestamptz,

  constraint chk_status_pendaftaran check (
    status_pendaftaran in ('Menunggu', 'Disetujui', 'Ditolak')
  )
);

create unique index idx_mitra_username on mitra(username) where deleted_at is null;

-- ------------------------------------------------------------
-- TABEL: danus_katalog
-- ------------------------------------------------------------
create table danus_katalog (
  id_produk                     uuid primary key default gen_random_uuid(),
  id_mitra                      uuid not null references mitra(id_mitra),
  nama_item                     varchar(150) not null,
  harga_jual                    numeric(12,2) not null,
  persentase_margin_himatif     numeric(5,2) not null, -- persen, dihitung dari harga per produk
  status                        varchar(20) not null default 'Aktif', -- Aktif/Nonaktif
  dibuat_pada                   timestamptz not null default now(),
  deleted_at                    timestamptz
);

create index idx_danus_katalog_mitra on danus_katalog(id_mitra);

-- ------------------------------------------------------------
-- TABEL: danus_stok (di-scope per mitra — tiap mitra kelola stoknya sendiri)
-- ------------------------------------------------------------
create table danus_stok (
  id_barang       uuid primary key default gen_random_uuid(),
  id_mitra        uuid not null references mitra(id_mitra),
  nama_bahan      varchar(150) not null,
  stok_saat_ini   numeric(12,2) not null default 0,
  batas_minimum   numeric(12,2) not null default 0,
  satuan          varchar(20) not null,
  deleted_at      timestamptz
);

create index idx_danus_stok_mitra on danus_stok(id_mitra);

-- ------------------------------------------------------------
-- TABEL: produk_bahan (resep produk, many-to-many)
-- ------------------------------------------------------------
create table produk_bahan (
  id_produk         uuid not null references danus_katalog(id_produk),
  id_barang         uuid not null references danus_stok(id_barang),
  jumlah_pemakaian  numeric(12,2) not null,
  primary key (id_produk, id_barang)
);

-- ------------------------------------------------------------
-- TABEL: danus_penjualan
-- ------------------------------------------------------------
create table danus_penjualan (
  id_penjualan                        uuid primary key default gen_random_uuid(),
  id_produk                           uuid not null references danus_katalog(id_produk),
  kuantitas                           int not null,
  total_omzet                         numeric(12,2) not null,
  persentase_margin_saat_transaksi    numeric(5,2) not null, -- SNAPSHOT, bukan rujuk ulang ke katalog
  hak_himatif                         numeric(12,2) not null,
  hak_mitra                           numeric(12,2) not null,
  waktu_transaksi                     timestamptz not null default now(),
  status_transaksi                    varchar(20) not null default 'Selesai', -- Selesai/Dibatalkan
  dibatalkan_oleh                     uuid,  -- id_mitra yang membatalkan (referensi longgar, divalidasi di app layer)
  dibatalkan_pada                     timestamptz,
  alasan_pembatalan                   text,

  constraint chk_status_transaksi check (status_transaksi in ('Selesai', 'Dibatalkan'))
);

create index idx_danus_penjualan_produk on danus_penjualan(id_produk);

-- Sekarang baru tambahkan FK dari kas_transaksi ke danus_penjualan (tabel ini baru dibuat)
alter table kas_transaksi
  add constraint fk_kas_transaksi_penjualan
  foreign key (id_penjualan) references danus_penjualan(id_penjualan);

-- ------------------------------------------------------------
-- TABEL: log_stok (audit trail pergerakan stok)
-- ------------------------------------------------------------
create table log_stok (
  id_log            uuid primary key default gen_random_uuid(),
  id_barang         uuid not null references danus_stok(id_barang),
  jenis_pergerakan  varchar(20) not null, -- Masuk/Keluar/Pembatalan
  jumlah            numeric(12,2) not null,
  id_penjualan      uuid references danus_penjualan(id_penjualan),
  waktu             timestamptz not null default now(),
  keterangan         text,

  constraint chk_jenis_pergerakan check (jenis_pergerakan in ('Masuk', 'Keluar', 'Pembatalan'))
);

create index idx_log_stok_barang on log_stok(id_barang);

-- ============================================================
-- FUNCTION: proses_transaksi_danus
-- Mengeksekusi seluruh algoritma transaksi Danus dalam SATU transaksi atomik:
--   1. Hitung omzet & margin (snapshot)
--   2. Insert danus_penjualan
--   3. Potong stok semua bahan baku (TIDAK diblokir walau stok jadi minus)
--   4. Insert log_stok utk tiap bahan
--   5. Insert kas_transaksi otomatis (sinkron ke Kas Danus)
-- ============================================================
create or replace function proses_transaksi_danus(
  p_id_produk uuid,
  p_kuantitas int,
  p_id_user_penerima uuid  -- user HIMATIF yang jadi pemilik baris kas_transaksi (bisa null / akun sistem)
) returns uuid as $$
declare
  v_katalog danus_katalog%rowtype;
  v_total_omzet numeric(12,2);
  v_hak_himatif numeric(12,2);
  v_hak_mitra numeric(12,2);
  v_id_penjualan uuid;
  v_bahan record;
  v_stok_sesudah numeric(12,2);
begin
  select * into v_katalog from danus_katalog where id_produk = p_id_produk and deleted_at is null;
  if not found then
    raise exception 'Produk tidak ditemukan';
  end if;

  v_total_omzet := v_katalog.harga_jual * p_kuantitas;
  v_hak_himatif := round(v_total_omzet * v_katalog.persentase_margin_himatif / 100, 2);
  v_hak_mitra := v_total_omzet - v_hak_himatif;

  insert into danus_penjualan (
    id_produk, kuantitas, total_omzet,
    persentase_margin_saat_transaksi, hak_himatif, hak_mitra
  ) values (
    p_id_produk, p_kuantitas, v_total_omzet,
    v_katalog.persentase_margin_himatif, v_hak_himatif, v_hak_mitra
  ) returning id_penjualan into v_id_penjualan;

  -- Potong stok semua bahan baku sesuai resep (produk_bahan), TANPA blokir jika kurang
  for v_bahan in
    select pb.id_barang, pb.jumlah_pemakaian, ds.stok_saat_ini, ds.batas_minimum, ds.nama_bahan
    from produk_bahan pb
    join danus_stok ds on ds.id_barang = pb.id_barang
    where pb.id_produk = p_id_produk
  loop
    v_stok_sesudah := v_bahan.stok_saat_ini - (v_bahan.jumlah_pemakaian * p_kuantitas);

    update danus_stok set stok_saat_ini = v_stok_sesudah where id_barang = v_bahan.id_barang;

    insert into log_stok (id_barang, jenis_pergerakan, jumlah, id_penjualan, keterangan)
    values (
      v_bahan.id_barang, 'Keluar', v_bahan.jumlah_pemakaian * p_kuantitas, v_id_penjualan,
      case
        when v_stok_sesudah < 0 then 'PERINGATAN: stok minus setelah transaksi ini'
        when v_stok_sesudah < v_bahan.batas_minimum then 'Peringatan: stok di bawah batas minimum'
        else null
      end
    );
  end loop;

  -- Sinkron otomatis ke Kas Danus
  insert into kas_transaksi (
    id_user, jenis, kategori, id_penjualan, nominal,
    status, sumber_transaksi
  ) values (
    p_id_user_penerima, 'Masuk', 'Kas Danus', v_id_penjualan, v_hak_himatif,
    'Lunas', 'Otomatis-Danus'
  );

  return v_id_penjualan;
end;
$$ language plpgsql;

-- ============================================================
-- FUNCTION: batalkan_transaksi_danus
-- Rollback stok + nullify entri kas terkait, dalam satu transaksi atomik.
-- ============================================================
create or replace function batalkan_transaksi_danus(
  p_id_penjualan uuid,
  p_id_mitra_pembatal uuid,
  p_alasan text
) returns void as $$
declare
  v_penjualan danus_penjualan%rowtype;
  v_bahan record;
begin
  select * into v_penjualan from danus_penjualan where id_penjualan = p_id_penjualan;
  if not found then
    raise exception 'Transaksi tidak ditemukan';
  end if;
  if v_penjualan.status_transaksi = 'Dibatalkan' then
    raise exception 'Transaksi sudah dibatalkan sebelumnya';
  end if;

  update danus_penjualan
  set status_transaksi = 'Dibatalkan',
      dibatalkan_oleh = p_id_mitra_pembatal,
      dibatalkan_pada = now(),
      alasan_pembatalan = p_alasan
  where id_penjualan = p_id_penjualan;

  -- Kembalikan stok
  for v_bahan in
    select pb.id_barang, pb.jumlah_pemakaian
    from produk_bahan pb
    where pb.id_produk = v_penjualan.id_produk
  loop
    update danus_stok
    set stok_saat_ini = stok_saat_ini + (v_bahan.jumlah_pemakaian * v_penjualan.kuantitas)
    where id_barang = v_bahan.id_barang;

    insert into log_stok (id_barang, jenis_pergerakan, jumlah, id_penjualan, keterangan)
    values (v_bahan.id_barang, 'Pembatalan', v_bahan.jumlah_pemakaian * v_penjualan.kuantitas,
            p_id_penjualan, 'Rollback dari pembatalan transaksi');
  end loop;

  -- Nullify entri kas terkait
  update kas_transaksi set status = 'Ditolak' where id_penjualan = p_id_penjualan;
end;
$$ language plpgsql;
