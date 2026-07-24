-- ============================================================
-- MIGRATION 0008: STRUKTUR KEPANITIAAN PROKER
-- ============================================================

create table panitia_proker (
  id_panitia        uuid primary key default gen_random_uuid(),
  id_proker         uuid not null references proker(id_proker),
  id_user           uuid not null references users(id_user),
  peran             varchar(100) not null,  -- mis. "Penanggung Jawab", "Ketua Pelaksana", "Sie Acara"
  ditambahkan_pada  timestamptz not null default now(),

  unique (id_proker, id_user, peran)
);

create index idx_panitia_proker_proker on panitia_proker(id_proker);

alter table panitia_proker enable row level security;
-- Tanpa policy (default-deny anon/authenticated) -- akses hanya lewat server, sama seperti tabel lain.
