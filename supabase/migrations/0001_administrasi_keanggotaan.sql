-- ============================================================
-- MIGRATION 0001: ADMINISTRASI & KEANGGOTAAN
-- PANEL HMIF
-- ============================================================

-- Ekstensi untuk UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TABEL: periode
-- ------------------------------------------------------------
create table periode (
  id_periode      uuid primary key default gen_random_uuid(),
  nama_periode    varchar(100) not null,
  tahun           int not null,
  status_aktif    boolean not null default false,
  dibuat_pada     timestamptz not null default now()
);

-- Hanya boleh ada SATU periode dengan status_aktif = true.
-- Diberlakukan lewat partial unique index, bukan cek aplikasi saja,
-- supaya tidak mungkin tembus race condition.
create unique index idx_periode_hanya_satu_aktif
  on periode (status_aktif)
  where status_aktif = true;

comment on table periode is 'Masa kepengurusan HIMATIF. Hanya 1 baris boleh aktif dalam satu waktu.';

-- ------------------------------------------------------------
-- TABEL: roles (BPH, Kadiv, Anggota — Mitra punya tabel sendiri)
-- ------------------------------------------------------------
create table roles (
  id_role     uuid primary key default gen_random_uuid(),
  nama_role   varchar(50) not null unique
);

insert into roles (nama_role) values ('BPH'), ('Kadiv'), ('Anggota');

-- ------------------------------------------------------------
-- TABEL: jabatan (khusus lingkup BPH)
-- ------------------------------------------------------------
create table jabatan (
  id_jabatan    uuid primary key default gen_random_uuid(),
  nama_jabatan  varchar(50) not null unique
);

insert into jabatan (nama_jabatan) values
  ('Ketua'), ('Wakil Ketua'), ('Sekretaris'), ('Bendahara');

-- ------------------------------------------------------------
-- TABEL: divisi (khusus lingkup Kadiv/Anggota)
-- ------------------------------------------------------------
create table divisi (
  id_divisi     uuid primary key default gen_random_uuid(),
  nama_divisi   varchar(50) not null unique
);

insert into divisi (nama_divisi) values
  ('PSDM'), ('Dep Lugri'), ('Dep Dagri'), ('Medif');

-- ------------------------------------------------------------
-- TABEL: users
-- ------------------------------------------------------------
create table users (
  id_user                   uuid primary key default gen_random_uuid(),
  nim                       varchar(30) not null,
  nama_lengkap              varchar(150) not null,
  angkatan                  varchar(10),
  tahun_masuk_organisasi    varchar(10),         -- self-declared, informasional saja
  password_hash             text not null,
  harus_ganti_password      boolean not null default false,
  nomor_whatsapp            varchar(20),
  kode_kartu                varchar(64) not null, -- token QR, digenerate SAAT registrasi selesai
  is_superadmin             boolean not null default false, -- flag permanen, TIDAK terikat periode
  status                    varchar(20) not null default 'Aktif', -- Aktif / Nonaktif
  password_direset_oleh     uuid references users(id_user),
  password_direset_pada     timestamptz,
  dibuat_pada                timestamptz not null default now(),
  deleted_at                timestamptz
);

-- NIM unik SEJAK baris pertama dibuat (partial index abaikan yang sudah soft-deleted
-- supaya NIM bisa dipakai daftar ulang kalau akun lama dihapus/soft-delete)
create unique index idx_users_nim_aktif
  on users (nim) where deleted_at is null;

create unique index idx_users_kode_kartu
  on users (kode_kartu) where deleted_at is null;

comment on column users.kode_kartu is 'Token acak unik, encoded sebagai QR di ID Card. Permanen seumur keanggotaan, tidak pernah direset.';
comment on column users.is_superadmin is 'Developer-level flag, independen total dari jabatan organisasi (Ketua dkk).';

-- ------------------------------------------------------------
-- TABEL: anggota_periode (jembatan user <-> periode)
-- ------------------------------------------------------------
create table anggota_periode (
  id_anggota_periode  uuid primary key default gen_random_uuid(),
  id_user             uuid not null references users(id_user),
  id_periode          uuid not null references periode(id_periode),
  id_role             uuid not null references roles(id_role),
  id_jabatan          uuid references jabatan(id_jabatan),   -- terisi hanya jika id_role = BPH
  id_divisi           uuid references divisi(id_divisi),     -- terisi hanya jika id_role = Kadiv/Anggota
  ditambahkan_oleh    uuid not null references users(id_user),
  ditambahkan_pada    timestamptz not null default now(),

  unique (id_user, id_periode),

  -- Validasi silang: BPH wajib punya jabatan & tidak boleh punya divisi;
  -- Kadiv/Anggota tidak boleh punya jabatan (boleh punya/tanpa divisi utk kasus tertentu)
  constraint chk_role_jabatan_divisi check (
    (id_jabatan is not null and id_divisi is null) or
    (id_jabatan is null)
  )
);

create index idx_anggota_periode_user on anggota_periode(id_user);
create index idx_anggota_periode_periode on anggota_periode(id_periode);

comment on table anggota_periode is 'Satu user = satu identitas permanen. Jabatan/divisi/role berubah per periode lewat tabel ini.';
