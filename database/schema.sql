-- SCHEMA NGENYANGIN (instalasi baru; hasil akhir setelah migration.sql)
-- Untuk database yang sudah berisi, pakai migration.sql.
CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);

CREATE TABLE public.categories (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    image_url text,
    created_at timestamp(0) without time zone DEFAULT now(),
    updated_at timestamp(0) without time zone DEFAULT now()
);

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;

CREATE TABLE public.detail_purchases (
    id bigint NOT NULL,
    purchase_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity integer NOT NULL,
    discount_price integer NOT NULL,
    subtotal integer NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    original_price integer,
    food_name character varying(255),
    food_image text,
    CONSTRAINT detail_purchases_quantity_check CHECK ((quantity > 0))
);

CREATE SEQUENCE public.detail_purchases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.detail_purchases_id_seq OWNED BY public.detail_purchases.id;

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;

CREATE TABLE public.log_purchases (
    id bigint NOT NULL,
    purchase_id bigint NOT NULL,
    keterangan text,
    action character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

CREATE SEQUENCE public.log_purchases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.log_purchases_id_seq OWNED BY public.log_purchases.id;

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);

CREATE TABLE public.products (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    discount_price integer NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    category character varying DEFAULT 'Makanan Berat'::character varying NOT NULL,
    image_url text,
    original_price integer DEFAULT 0 NOT NULL,
    supplier_name text,
    outlet text,
    pickup_deadline text,
    safety_approved boolean DEFAULT false NOT NULL,
    supplier_id bigint,
    discount smallint DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    address text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    category_id bigint,
    CONSTRAINT products_discount_check CHECK (((discount >= 0) AND (discount <= 100))),
    CONSTRAINT products_discount_price_check CHECK ((discount_price >= 0)),
    CONSTRAINT products_original_price_check CHECK ((original_price >= 0)),
    CONSTRAINT products_stock_check CHECK ((stock >= 0))
);

CREATE SEQUENCE public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;

CREATE TABLE public.purchases (
    id bigint NOT NULL,
    consumer_id bigint NOT NULL,
    total integer NOT NULL,
    status character varying(255) DEFAULT 'Menunggu'::character varying NOT NULL,
    payment_url character varying(255),
    order_number character varying(20) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    supplier_id bigint,
    courier_id bigint,
    delivery_method character varying(10) DEFAULT 'pickup'::character varying NOT NULL,
    delivery_address text,
    special_note text,
    delivery_fee integer DEFAULT 0 NOT NULL,
    timeline jsonb DEFAULT '[]'::jsonb NOT NULL,
    rating smallint,
    review_comment text,
    reviewed_at timestamp(0) without time zone,
    CONSTRAINT purchases_delivery_method_check CHECK (((delivery_method)::text = ANY ((ARRAY['courier'::character varying, 'pickup'::character varying])::text[]))),
    CONSTRAINT purchases_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT purchases_status_check CHECK (((status)::text = ANY ((ARRAY['Menunggu'::character varying, 'Diproses'::character varying, 'Siap Diambil'::character varying, 'Dalam Pengantaran'::character varying, 'Selesai'::character varying, 'Dibatalkan'::character varying])::text[])))
);

CREATE SEQUENCE public.purchases_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255),
    phone character varying(255),
    role character varying(255) DEFAULT 'consumer'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    address text,
    outlet character varying(255),
    description text,
    vehicle character varying(100),
    radius numeric(4,1),
    bag_status character varying(100),
    rating numeric(3,2),
    avatar text,
    gender character varying(10),
    CONSTRAINT users_gender_check CHECK (((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying])::text[]))),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['consumer'::character varying, 'supplier'::character varying, 'courier'::character varying, 'admin'::character varying])::text[])))
);

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);

ALTER TABLE ONLY public.detail_purchases ALTER COLUMN id SET DEFAULT nextval('public.detail_purchases_id_seq'::regclass);

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);

ALTER TABLE ONLY public.log_purchases ALTER COLUMN id SET DEFAULT nextval('public.log_purchases_id_seq'::regclass);

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_unique UNIQUE (name);

ALTER TABLE ONLY public.detail_purchases
    ADD CONSTRAINT detail_purchases_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.log_purchases
    ADD CONSTRAINT log_purchases_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_order_number_unique UNIQUE (order_number);

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);

CREATE INDEX categories_name_idx ON public.categories USING btree (name);

CREATE INDEX products_category_idx ON public.products USING btree (category);

CREATE INDEX products_category_id_idx ON public.products USING btree (category_id);

CREATE INDEX products_supplier_idx ON public.products USING btree (supplier_id);

CREATE INDEX purchases_consumer_idx ON public.purchases USING btree (consumer_id);

CREATE INDEX purchases_supplier_idx ON public.purchases USING btree (supplier_id);

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);

CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER purchases_updated BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE ONLY public.detail_purchases
    ADD CONSTRAINT detail_purchases_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.detail_purchases
    ADD CONSTRAINT detail_purchases_purchase_id_foreign FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.log_purchases
    ADD CONSTRAINT log_purchases_purchase_id_foreign FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_user_id_foreign FOREIGN KEY (consumer_id) REFERENCES public.users(id) ON DELETE CASCADE;

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images','product-images',true), ('avatars','avatars',true) ON CONFLICT (id) DO NOTHING;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
