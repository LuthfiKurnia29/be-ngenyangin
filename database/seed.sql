-- ==========================================
-- SEED DATA SQL: NGENYANGIN
-- Jalankan query ini di Supabase SQL Editor
-- ==========================================

-- Bersihkan data lama (opsional)
-- TRUNCATE TABLE foods, users RESTART IDENTITY CASCADE;

-- Insert Seed Data Users
INSERT INTO users (name, email, role)
VALUES 
    ('Admin Ngenyangin', 'admin@ngenyangin.id', 'admin'),
    ('Budi Santoso', 'budi@gmail.com', 'customer'),
    ('Siti Rahma', 'siti@gmail.com', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Insert Seed Data Foods
INSERT INTO foods (name, description, price, stock, category, image_url)
VALUES 
    ('Nasi Goreng Spesial', 'Nasi goreng dengan telur, suwir ayam, dan acar segar', 25000, 50, 'Makanan Berat', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b'),
    ('Ayam Bakar Madu', 'Ayam panggang bumbu madu khas Nusantara', 32000, 30, 'Makanan Berat', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b'),
    ('Es Teh Manis', 'Teh melati manis segar dingin', 5000, 100, 'Minuman', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc'),
    ('Pisang Goreng Crispy', 'Pisang raja goreng tepung renyah dengan topping keju cokelat', 18000, 40, 'Camilan', 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c')
ON CONFLICT DO NOTHING;

