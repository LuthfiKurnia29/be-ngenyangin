-- ==========================================================
-- MIGRASI FITUR KATEGORI (CATEGORY) & CATEGORY_ID DI PRODUCTS
-- Aman dijalankan berulang kali (Idempotent).
-- Jalankan di SQL Editor Supabase Dashboard.
-- ==========================================================

BEGIN;

-- 1. Buat fungsi helper updated_at jika belum ada
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- 2. Buat tabel categories
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    image_url text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now()
);

-- 3. Sequence untuk auto-increment ID kategori
CREATE SEQUENCE IF NOT EXISTS public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);

-- 4. Constraint Primary Key & Unique Nama Kategori
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_pkey'
    ) THEN
        ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_unique'
    ) THEN
        ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_name_unique UNIQUE (name);
    END IF;
END $$;

-- 5. Trigger updated_at pada categories
DROP TRIGGER IF EXISTS categories_updated ON public.categories;
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Tambahkan kolom category_id ke tabel products (jika belum ada)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id bigint;

-- 7. Tambahkan Foreign Key dari products ke categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey'
    ) THEN
        ALTER TABLE ONLY public.products
            ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id)
            REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 8. Index untuk performa pencarian / filter
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS categories_name_idx ON public.categories(name);

-- 9. Pindahkan / sinkronkan nama kategori yang sudah ada di products ke tabel categories
INSERT INTO public.categories (name)
SELECT DISTINCT TRIM(category)
FROM public.products
WHERE category IS NOT NULL AND TRIM(category) <> ''
ON CONFLICT (name) DO NOTHING;

-- Tambahkan kategori bawaan jika tabel categories masih kosong
INSERT INTO public.categories (name, description) VALUES
    ('Makanan Berat', 'Nasi, mie, lauk pauk, dan menu makanan utama'),
    ('Makanan Ringan', 'Camilan, gorengan, kue basah, dan kudapan'),
    ('Minuman', 'Kopi, teh, jus, dan aneka minuman segar'),
    ('Roti & Pastry', 'Roti, donat, pastry, dan aneka bakery'),
    ('Sayur & Buah', 'Produk segar sayuran dan buah-buahan')
ON CONFLICT (name) DO NOTHING;

-- 10. Hubungkan produk yang sudah ada ke ID kategorinya masing-masing
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category_id IS NULL AND TRIM(p.category) = c.name;

-- 11. Berikan hak akses tabel ke role Supabase
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.categories_id_seq TO anon, authenticated, service_role;

COMMIT;

