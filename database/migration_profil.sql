-- Tambahan untuk fitur profil: jenis kelamin (ikon default konsumen) + bucket foto profil.
-- Aman dijalankan ulang. Jalankan di Supabase SQL Editor SETELAH migration.sql.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender      varchar(10);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS outlet      varchar(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar      text;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE public.users ADD CONSTRAINT users_gender_check CHECK (gender IN ('male','female'));

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
