-- ============================================================
-- MIGRATION 0007: SURAT MASUK / KELUAR (SEKRETARIS)
-- ============================================================

create table surat (
  id_surat        uuid primary key default gen_random_uuid(),
  id_periode      uuid not null references periode(id_periode),
  jenis           varchar(10) not null,   -- Masuk / Keluar
  nomor_surat     varchar(100) not null,
  perihal         varchar(200) not null,
  tanggal_surat   date not null,
  asal_tujuan     varchar(150),           -- pengirim (jika Masuk) atau penerima (jika Keluar)
  url_dokumen     text,
  dicatat_oleh    uuid not null references users(id_user),
  dibuat_pada     timestamptz not null default now(),
  deleted_at      timestamptz,

  constraint chk_jenis_surat check (jenis in ('Masuk', 'Keluar'))
);

create index idx_surat_periode on surat(id_periode);
create index idx_surat_jenis on surat(jenis);

alter table surat enable row level security;
-- Sengaja tanpa policy (default-deny untuk anon/authenticated), sama seperti tabel lain --
-- akses hanya lewat server (service_role) via server actions yang sudah punya guard sendiri.
