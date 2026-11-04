-- ==========================================================
-- MIGRASI IN-PLACE NGENYANGIN
-- Tabel lama TETAP DIPAKAI (users, products, purchases, detail_purchases, log_purchases).
-- Hanya: ganti nama kolom, tambah kolom, hapus kolom, dan ubah isi nilai. Tidak ada tabel baru/DROP TABLE.
-- LAKUKAN BACKUP DULU. Berjalan dalam 1 transaksi (gagal = batal semua).
-- ==========================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------- 1. USERS (id tetap bigint) ----------
ALTER TABLE public.users DROP CONSTRAINT users_role_check;
UPDATE public.users SET role = CASE role WHEN 'pembeli' THEN 'consumer' WHEN 'penjual' THEN 'supplier' ELSE role END;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (role IN ('consumer','supplier','courier','admin')),
  ALTER COLUMN role SET DEFAULT 'consumer',
  ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.users
  DROP COLUMN username,          -- FE login pakai email
  DROP COLUMN password,          -- auth lewat Supabase Auth
  DROP COLUMN remember_token,
  DROP COLUMN email_verified_at,
  ADD COLUMN address     text,
  ADD COLUMN outlet      varchar(255),   -- supplier
  ADD COLUMN description text,           -- supplier
  ADD COLUMN vehicle     varchar(100),   -- kurir
  ADD COLUMN radius      numeric(4,1),   -- kurir
  ADD COLUMN bag_status  varchar(100),   -- kurir
  ADD COLUMN rating      numeric(3,2),   -- kurir
  ADD COLUMN avatar      text;

CREATE TRIGGER users_updated BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 2. PRODUCTS ----------
ALTER TABLE public.products RENAME COLUMN harga TO discount_price;

ALTER TABLE public.products
  ADD COLUMN supplier_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN discount    smallint NOT NULL DEFAULT 0,
  ADD COLUMN is_active   boolean  NOT NULL DEFAULT true,
  ADD COLUMN address     text,
  ADD COLUMN tags        text[]   NOT NULL DEFAULT '{}';

UPDATE public.products SET is_active = NOT is_empty;      -- is_empty lama -> is_active
ALTER TABLE public.products DROP COLUMN is_empty;

ALTER TABLE public.products ALTER COLUMN description DROP NOT NULL;

UPDATE public.products SET category = 'Makanan Berat' WHERE category IS NULL OR category = '';
ALTER TABLE public.products
  ALTER COLUMN category SET DEFAULT 'Makanan Berat', ALTER COLUMN category SET NOT NULL;

UPDATE public.products SET original_price = COALESCE(NULLIF(original_price, 0), discount_price);
ALTER TABLE public.products
  ALTER COLUMN original_price TYPE integer USING round(original_price)::integer,
  ALTER COLUMN original_price SET DEFAULT 0, ALTER COLUMN original_price SET NOT NULL;

UPDATE public.products
SET discount = LEAST(100, GREATEST(0, round((1 - discount_price::numeric / original_price) * 100)))
WHERE original_price > 0;

UPDATE public.products SET safety_approved = false WHERE safety_approved IS NULL;
ALTER TABLE public.products
  ALTER COLUMN safety_approved SET DEFAULT false, ALTER COLUMN safety_approved SET NOT NULL;

ALTER TABLE public.products
  ADD CONSTRAINT products_original_price_check CHECK (original_price >= 0),
  ADD CONSTRAINT products_discount_price_check CHECK (discount_price >= 0),
  ADD CONSTRAINT products_discount_check CHECK (discount BETWEEN 0 AND 100),
  ADD CONSTRAINT products_stock_check CHECK (stock >= 0);

-- hubungkan ke supplier lewat nama outlet (jika users.outlet sudah terisi)
UPDATE public.products p SET supplier_id = u.id
FROM public.users u
WHERE u.role = 'supplier' AND lower(u.outlet) = lower(p.supplier_name) AND p.supplier_id IS NULL;

CREATE INDEX products_supplier_idx ON public.products(supplier_id);
CREATE INDEX products_category_idx ON public.products(category);
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 3. PURCHASES (= header pesanan di FE) ----------
ALTER TABLE public.purchases RENAME COLUMN user_id     TO consumer_id;
ALTER TABLE public.purchases RENAME COLUMN harga_total TO total;
ALTER TABLE public.purchases RENAME COLUMN id_transaksi TO order_number;

ALTER TABLE public.purchases DROP CONSTRAINT purchases_status_check;
UPDATE public.purchases SET status = CASE status
  WHEN 'pending' THEN 'Menunggu' WHEN 'success' THEN 'Selesai' WHEN 'cancelled' THEN 'Dibatalkan' ELSE status END;
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_status_check CHECK (status IN
    ('Menunggu','Diproses','Siap Diambil','Dalam Pengantaran','Selesai','Dibatalkan')),
  ALTER COLUMN status SET DEFAULT 'Menunggu';

UPDATE public.purchases SET order_number = 'NGN-' || lpad(id::text, 6, '0') WHERE order_number IS NULL OR order_number = '';
ALTER TABLE public.purchases
  ALTER COLUMN order_number TYPE varchar(20),
  ALTER COLUMN order_number SET NOT NULL,
  ADD CONSTRAINT purchases_order_number_unique UNIQUE (order_number);

ALTER TABLE public.purchases
  ADD COLUMN supplier_id      bigint REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN courier_id       bigint REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN delivery_method  varchar(10) NOT NULL DEFAULT 'pickup' CHECK (delivery_method IN ('courier','pickup')),
  ADD COLUMN delivery_address text,
  ADD COLUMN special_note     text,
  ADD COLUMN delivery_fee     integer NOT NULL DEFAULT 0,
  ADD COLUMN timeline         jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{step,time,status}]
  ADD COLUMN rating           smallint CHECK (rating BETWEEN 1 AND 5),  -- ulasan (ReviewPage)
  ADD COLUMN review_comment   text,
  ADD COLUMN reviewed_at      timestamp(0) without time zone;

-- supplier pesanan diambil dari produk pertama di detail
UPDATE public.purchases pu SET supplier_id = x.supplier_id
FROM (SELECT DISTINCT ON (d.purchase_id) d.purchase_id, p.supplier_id
      FROM public.detail_purchases d JOIN public.products p ON p.id = d.product_id
      ORDER BY d.purchase_id, d.id) x
WHERE x.purchase_id = pu.id;

CREATE INDEX purchases_consumer_idx ON public.purchases(consumer_id);
CREATE INDEX purchases_supplier_idx ON public.purchases(supplier_id);
CREATE TRIGGER purchases_updated BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 4. DETAIL_PURCHASES (= item pesanan) ----------
ALTER TABLE public.detail_purchases RENAME COLUMN jumlah      TO quantity;
ALTER TABLE public.detail_purchases RENAME COLUMN "priceQty"  TO discount_price;
ALTER TABLE public.detail_purchases RENAME COLUMN total_price TO subtotal;
ALTER TABLE public.detail_purchases
  ALTER COLUMN discount_price TYPE integer USING round(discount_price)::integer,
  ALTER COLUMN subtotal       TYPE integer USING round(subtotal)::integer,
  ADD COLUMN original_price integer,
  ADD COLUMN food_name      varchar(255),     -- snapshot saat order
  ADD COLUMN food_image     text,
  ADD CONSTRAINT detail_purchases_quantity_check CHECK (quantity > 0);

UPDATE public.detail_purchases d
SET original_price = GREATEST(p.original_price, d.discount_price), food_name = p.name, food_image = p.image_url
FROM public.products p WHERE p.id = d.product_id;

-- ---------- 5. Storage gambar produk + hak akses ----------
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Catatan: log_purchases tidak diubah. Tabel Laravel (cache, jobs, sessions, dst.) tidak disentuh.
-- Pengaduan (complaints) di FE masih data mock, jadi belum ada tabelnya.
