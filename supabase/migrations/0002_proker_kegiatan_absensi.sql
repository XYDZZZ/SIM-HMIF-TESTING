-- ============================================================
-- MIGRATION 0002: PROKER, DOKUMEN, KEGIATAN, ABSENSI
-- ============================================================

-- ------------------------------------------------------------
-- TABEL: proker
-- ------------------------------------------------------------
create table proker (
  id_proker         uuid primary key default gen_random_uuid(),
  nama_proker       varchar(150) not null,
  id_periode        uuid not null references periode(id_periode),
  id_divisi         uuid references divisi(id_divisi),  -- NULL = proker bersama (dikelola BPH)
  status_proker     varchar(20) not null default 'Direncanakan', -- Direncanakan/Berjalan/Selesai/Dibatalkan
  tanggal_mulai     date,
  tanggal_selesai   date,
  deskripsi         text,
  dibuat_oleh       uuid not null references users(id_user),
  dibuat_pada       timestamptz not null default now(),
  deleted_at        timestamptz
);

create index idx_proker_periode on proker(id_periode);
create index idx_proker_divisi on proker(id_divisi);

comment on column proker.id_divisi is 'NULL berarti proker bersama lintas divisi, dikelola BPH bukan Kadiv.';

-- ------------------------------------------------------------
-- TABEL: dokumen_proker (one-to-many: satu proker banyak dokumen)
-- ------------------------------------------------------------
create table dokumen_proker (
  id_dokumen      uuid primary key default gen_random_uuid(),
  id_proker       uuid not null references proker(id_proker),
  nama_dokumen    varchar(150) not null,
  jenis_dokumen   varchar(30) not null, -- Proposal/Surat/LPJ/Dokumentasi/Lainnya
  url_dokumen     text not null,        -- URL Google Drive
  diunggah_oleh   uuid not null references users(id_user),
  diunggah_pada   timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_dokumen_proker_proker on dokumen_proker(id_proker);

-- ------------------------------------------------------------
-- TABEL: kegiatan (terpisah dari proker — dasar sistem absensi)
-- ------------------------------------------------------------
create table kegiatan (
  id_kegiatan     uuid primary key default gen_random_uuid(),
  nama_kegiatan   varchar(150) not null,
  id_proker       uuid references proker(id_proker),  -- nullable: rapat rutin tidak wajib terikat proker
  id_periode      uuid not null references periode(id_periode),
  waktu_mulai     timestamptz not null,
  toleransi_menit int not null default 15,
  bobot_poin      numeric(5,2) not null default 1,   -- bisa diedit kapan saja (CRUD)
  dibuat_oleh     uuid not null references users(id_user),
  dibuat_pada     timestamptz not null default now(),
  deleted_at      timestamptz
);

create index idx_kegiatan_periode on kegiatan(id_periode);
create index idx_kegiatan_proker on kegiatan(id_proker);

comment on column kegiatan.bobot_poin is 'Bobot poin keaktifan. Berubah di sini otomatis memengaruhi rekap poin karena dihitung on-demand, bukan disimpan statis.';

-- ------------------------------------------------------------
-- TABEL: absensi
-- ------------------------------------------------------------
create table absensi (
  id_absensi        uuid primary key default gen_random_uuid(),
  id_kegiatan       uuid not null references kegiatan(id_kegiatan),
  id_user           uuid not null references users(id_user),
  waktu_absen       timestamptz,          -- NULL jika status Izin/Sakit
  status_kehadiran  varchar(20) not null, -- Tepat Waktu / Terlambat / Izin / Sakit
  metode_absen      varchar(10) not null, -- Scan / Manual
  diinput_oleh      uuid references users(id_user), -- terisi hanya jika metode_absen = Manual
  catatan           text,

  unique (id_kegiatan, id_user),  -- cegah dobel-absen di level database

  constraint chk_status_kehadiran check (
    status_kehadiran in ('Tepat Waktu', 'Terlambat', 'Izin', 'Sakit')
  ),
  constraint chk_metode_absen check (metode_absen in ('Scan', 'Manual')),
  constraint chk_manual_perlu_penginput check (
    (metode_absen = 'Manual' and diinput_oleh is not null) or (metode_absen = 'Scan')
  )
);

create index idx_absensi_kegiatan on absensi(id_kegiatan);
create index idx_absensi_user on absensi(id_user);

-- ------------------------------------------------------------
-- VIEW: rekap poin keaktifan (dihitung on-demand, tidak disimpan statis)
-- ------------------------------------------------------------
create view v_poin_keaktifan as
select
  a.id_user,
  k.id_periode,
  sum(k.bobot_poin) as total_poin
from absensi a
join kegiatan k on a.id_kegiatan = k.id_kegiatan
where a.status_kehadiran in ('Tepat Waktu', 'Terlambat')
group by a.id_user, k.id_periode;

comment on view v_poin_keaktifan is 'Rekap poin per user per periode. Query tanpa filter id_periode untuk total kumulatif seumur keanggotaan.';
