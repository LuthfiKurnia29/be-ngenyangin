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
### Data Barang / Makanan (`/api/v1/foods` atau `/api/v1/barang`)
- `GET /api/v1/foods` : Ambil daftar barang/makanan (mendukung query: `?search=...&category=...&limit=10&page=1`)
- `GET /api/v1/foods/:id` : Ambil detail satu barang berdasarkan UUID
- `POST /api/v1/foods` : Menambahkan data barang baru (body: `name`, `price`, `description`, `stock`, `category`, `image_url`)
- `PUT /api/v1/foods/:id` : Memperbarui data barang berdasarkan UUID
- `DELETE /api/v1/foods/:id` : Menghapus data barang berdasarkan UUID
*(Catatan: Rute di atas juga dapat diakses menggunakan prefix `/api/v1/barang`)*

### Autentikasi & Sesi User
- `POST /api/v1/auth/register` : Mendaftarkan akun user baru (body: `email`, `password`, `name`, `role`)
- `POST /api/v1/auth/login` : Login user dengan email dan password (body: `email`, `password`)
- `POST /api/v1/auth/logout` : Logout user / invalidate session
- `GET /api/v1/auth/me` : Mendapatkan data user & session aktif (Header: `Authorization: Bearer <access_token>`)
