-- ============================================================
-- SEED AWAL — jalankan SEKALI SAJA setelah semua file di migrations/
-- selesai dijalankan, saat pertama kali menyiapkan sistem.
--
-- GANTI seluruh nilai placeholder (--> tanda ini <--) sebelum dijalankan.
-- ============================================================

-- 1) Buat periode kepengurusan pertama
insert into periode (nama_periode, tahun, status_aktif)
values ('2026/2027', 2026, true);

-- 2) Buat akun Superadmin (developer-level, permanen, TIDAK lewat form registrasi)
--    Password di-hash langsung di SQL memakai pgcrypto (kompatibel dengan bcryptjs
--    yang dipakai aplikasi, sama-sama format bcrypt standar).
insert into users (
  nim, nama_lengkap, angkatan, tahun_masuk_organisasi,
  password_hash, nomor_whatsapp, kode_kartu, is_superadmin, status
) values (
  '02405036',
  'Hafidz Muftadin Amri',
  '2024',
  '2025',
  crypt('HafidzAmri11', gen_salt('bf', 12)),
  '081326474438',
  'HMIF-' || encode(gen_random_bytes(16), 'hex'),
  true,
  'Aktif'
);

-- 3) (Opsional tapi disarankan) Sekaligus assign Superadmin sebagai Ketua
--    di periode pertama, supaya langsung bisa memakai seluruh fitur BPH.
insert into anggota_periode (id_user, id_periode, id_role, id_jabatan, ditambahkan_oleh)
select
  u.id_user,
  p.id_periode,
  (select id_role from roles where nama_role = 'BPH'),
  (select id_jabatan from jabatan where nama_jabatan = 'Ketua'),
  u.id_user  -- ditambahkan oleh diri sendiri, karena ini seed awal
from users u, periode p
where u.nim = '02405036'
  and p.status_aktif = true;

-- Setelah ini jalan, kamu bisa langsung login di /login dengan NIM & password
-- yang barusan dibuat. SEGERA hapus/ubah password_awal_yang_kuat setelah login pertama.
