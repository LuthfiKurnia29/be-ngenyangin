# Backend Ngenyangin - RESTful API with Supabase

RESTful API backend dibangun dengan Node.js, Express.js, dan Supabase Database (PostgreSQL).

## 📁 Struktur Folder

```text
backend-ngenyangin/
├── .env                          # Variabel environment lokal (port, supabase credentials)
├── .env.example                  # Template environment variable
├── .gitignore                    # File/folder yang diabaikan Git
├── package.json                  # Dependensi dan script (start, dev, seed)
├── README.md                     # Dokumentasi proyek
├── database/                     # Skrip SQL untuk Supabase
│   ├── schema.sql                # DDL skema tabel (users, foods)
│   └── seed.sql                  # Data awal dalam format SQL
├── scripts/                      # Skrip utilitas CLI
│   └── seed.js                   # Skrip seeder otomatis via Supabase JS SDK
└── src/
    ├── app.js                    # Konfigurasi Express, middleware global, & routing
    ├── server.js                 # Entry point aplikasi (menjalankan server listener)
    ├── config/
    │   ├── env.js                # Konfigurasi env
    │   └── supabase.js           # Supabase client instance
    ├── controllers/              # HTTP Request & Response handler (tipis)
    │   ├── auth.controller.js
    │   ├── food.controller.js
    │   └── health.controller.js
    ├── services/                 # Business logic, validasi aturan & orkestrasi
    │   ├── auth.service.js
    │   └── food.service.js
    ├── models/                   # Akses data & query Supabase Database
    │   ├── user.model.js
    │   └── food.model.js
    ├── middlewares/
    │   ├── auth.js               # Verifikasi JWT session
    │   ├── errorHandler.js
    │   └── notFound.js
    ├── routes/                   # Definisi rute & mapping endpoint
    │   ├── api.js
    │   ├── auth.routes.js
    │   ├── food.routes.js
    │   └── health.routes.js
    └── utils/
        ├── errors.js             # Standard AppError class
        └── response.js           # Helper JSON response standar
```

## ⚙️ Persiapan Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Buat tabel database:
   - Buka menu **SQL Editor** di dashboard Supabase.
   - Buka file [database/schema.sql](file:///Users/maxindopro1215/Documents/College/Lomba/GardaTech/backend-ngenyangin/database/schema.sql), salin isinya, lalu jalankan (**Run**) di SQL Editor.
3. Dapatkan API Credentials:
   - Masuk ke **Project Settings -> API**.
   - Salin **Project URL** dan **anon (public)** key atau **service_role (secret)** key.
4. Isi file `.env`:
   ```env
   PORT=5000
   SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

## 🌱 Cara Seeding Data ke Supabase

Ada 2 cara yang bisa dipilih:

### Cara 1: Menggunakan Script Node.js (Rekomendasi)
Jalankan perintah ini di terminal:
```bash
npm run seed
```
Skrip [scripts/seed.js](file:///Users/maxindopro1215/Documents/College/Lomba/GardaTech/backend-ngenyangin/scripts/seed.js) akan otomatis mengisi tabel `users` dan `foods` menggunakan SDK `@supabase/supabase-js`.

### Cara 2: Langsung via Supabase SQL Editor
Buka file [database/seed.sql](file:///Users/maxindopro1215/Documents/College/Lomba/GardaTech/backend-ngenyangin/database/seed.sql), salin isinya ke **SQL Editor** di Supabase Dashboard, lalu klik tombol **Run**.

---

## 🚀 Menjalankan Server

- **Mode Development (Hot-reload)**:
  ```bash
  npm run dev
  ```
- **Mode Production**:
  ```bash
  npm start
  ```

## 📡 Endpoint Tersedia

### Public & Health
- `GET /` : Root greeting
- `GET /api/v1/health` : Health check status

### Kategori (`/api/v1/categories`)
- `GET /api/v1/categories` : Ambil daftar kategori (mendukung query: `?search=...&sortBy=id&order=asc&limit=10&page=1`)
- `GET /api/v1/categories/:id` : Ambil detail kategori berdasarkan ID
- `POST /api/v1/categories` : Tambah kategori baru (Header: `Authorization: Bearer <token>`, body: `name`, `description`, `image_url`)
- `PUT /api/v1/categories/:id` : Update kategori (Header: `Authorization: Bearer <token>`, body: `name`, `description`, `image_url`)
- `DELETE /api/v1/categories/:id` : Hapus kategori (Header: `Authorization: Bearer <token>`)
- `POST /api/v1/categories/upload` : Upload icon/gambar kategori (Header: `Authorization: Bearer <token>`, multipart field: `image`)

### Data Barang / Produk (`/api/v1/products`)
- `GET /api/v1/products` : Ambil daftar produk (mendukung query: `?search=...&category=...&category_id=...&limit=10&page=1`)
- `GET /api/v1/products/:id` : Ambil detail satu produk berdasarkan ID
- `POST /api/v1/products` : Menambahkan data produk baru (Header: `Authorization: Bearer <token>`, body: `name`, `discount_price` / `price`, `description`, `stock`, `categoryId` / `category_id`, `category`, `image_url`)
- `PUT /api/v1/products/:id` : Memperbarui data produk (Header: `Authorization: Bearer <token>`, body: `name`, `discount_price`, `categoryId` / `category_id`, dll)
- `DELETE /api/v1/products/:id` : Menghapus produk (Header: `Authorization: Bearer <token>`)
- `POST /api/v1/products/upload` : Upload gambar produk (Header: `Authorization: Bearer <token>`, multipart field: `image`)

### Autentikasi & Sesi User
- `POST /api/v1/auth/register` : Mendaftarkan akun user baru (body: `email`, `password`, `name`, `role` [consumer|supplier])
- `POST /api/v1/auth/login` : Login user dengan email dan password (body: `email`, `password`)
- `POST /api/v1/auth/logout` : Logout user / invalidate session
- `GET /api/v1/auth/me` : Mendapatkan data user & session aktif (Header: `Authorization: Bearer <access_token>`)

#### 🔑 Akun Demo (Default Password: `password123`)
Password disimpan di database dengan hash MD5.
| Role | Email | Password | Keterangan |
|---|---|---|---|
| Admin | `admin@demo.id` | `password123` | Akses penuh sistem |
| Supplier | `supplier@demo.id` | `password123` | Penjual makanan (Bebek Madura Bu Siti) |
| Consumer | `consumer@demo.id` | `password123` | Pembeli makanan (Budi Santoso) |
| Courier | `courier@demo.id` | `password123` | Kurir pengantaran (Kurir Kilat) |
