-- ==========================================
-- SKEMA DATABASE CONTOH: NGENYANGIN
-- Jalankan query ini di Supabase SQL Editor
-- ==========================================

-- Buat ekstensi UUID jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Products (dipakai FoodModel: from('products'))
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    harga NUMERIC(12, 2) NOT NULL,
    stock INT DEFAULT 0,
    is_empty BOOLEAN DEFAULT FALSE,
    category VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
