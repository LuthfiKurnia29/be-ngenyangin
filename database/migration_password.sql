-- ==========================================================
-- MIGRASI PENAMBAHAN KOLOM PASSWORD DI TABEL USERS
-- Format hash password: MD5 (32 karakter hex)
-- Jalankan di SQL Editor Supabase
-- ==========================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password varchar(255);

-- Update password default untuk user yang belum memiliki password (default: md5('password123') -> 482c811da5d5b4bc6d497ffa98491e38)
UPDATE public.users 
SET password = '482c811da5d5b4bc6d497ffa98491e38' 
WHERE password IS NULL;

