import { config } from '../src/config/env.js';
import { supabase } from '../src/config/supabase.js';
import { hashMD5 } from '../src/utils/crypto.js';

// Default password untuk semua akun seed: password123
const defaultPasswordHash = hashMD5('password123');

// Data awal pengguna untuk semua role (admin, supplier, consumer, courier)
const seedUsers = [
  {
    name: 'Admin NGENYANGIN',
    email: 'admin@demo.id',
    password: defaultPasswordHash,
    role: 'admin',
    phone: '021-5555-0000',
    address: 'Kantor Pusat Ngenyangin, Jakarta',
  },
  {
    name: 'Ahmad Fauzan',
    email: 'supplier@demo.id',
    password: defaultPasswordHash,
    role: 'supplier',
    phone: '081234567891',
    outlet: 'Bebek Madura Bu Siti',
    description: 'Menyediakan olahan bebek empuk bumbu hitam khas Madura.',
    address: 'Jl. Tebet Raya No. 42, Jakarta Selatan',
  },
  {
    name: 'Budi Santoso',
    email: 'consumer@demo.id',
    password: defaultPasswordHash,
    role: 'consumer',
    phone: '081234567892',
    gender: 'male',
    address: 'Jl. Sudirman No. 10, Jakarta Pusat',
  },
  {
    name: 'Kurir Kilat',
    email: 'courier@demo.id',
    password: defaultPasswordHash,
    role: 'courier',
    phone: '081298765432',
    vehicle: 'Honda Vario 160',
    radius: 10.0,
    bag_status: 'ready',
    rating: 4.9,
    address: 'Jl. Gatot Subroto No. 88, Jakarta Selatan',
  },
];

const seedCategories = [
  { name: 'Makanan Berat', description: 'Nasi, mie, lauk pauk, dan menu makanan utama' },
  { name: 'Makanan Ringan', description: 'Camilan, gorengan, kue basah, dan kudapan' },
  { name: 'Minuman', description: 'Kopi, teh, jus, dan aneka minuman segar' },
  { name: 'Roti & Pastry', description: 'Roti, donat, pastry, dan aneka bakery' },
  { name: 'Sayur & Buah', description: 'Produk segar sayuran dan buah-buahan' },
];

const seedFoods = (supplier, categoryMap = {}) => [
  {
    supplier_id: supplier.id,
    category_id: categoryMap['Makanan Berat'] || null,
    name: 'Paket Nasi Bebek Madura Bumbu Hitam',
    description: 'Nasi bebek bumbu hitam khas Madura dengan sambal terasi dan lalapan.',
    category: 'Makanan Berat',
    original_price: 35000,
    discount_price: 18000,
    discount: 49,
    stock: 5,
    pickup_deadline: '20:00',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b',
    safety_approved: true,
    supplier_name: supplier.outlet,
    outlet: 'Tebet, Jakarta Selatan',
    address: supplier.address,
    tags: ['Nasi', 'Bebek'],
  },
];

async function runSeed() {
  console.log('🌱 Memulai proses seeding ke Supabase...\n');

  if (!config.supabase.url || config.supabase.url.includes('your-project-ref')) {
    console.error('❌ Gagal: SUPABASE_URL belum dikonfigurasi dengan benar di file .env');
    process.exit(1);
  }

  try {
    // 1. Seed Users (upsert berdasarkan email)
    console.log('👤 Seeding tabel `users`...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .upsert(seedUsers, { onConflict: 'email' })
      .select();

    if (usersError) {
      throw new Error(`Gagal seeding users: ${usersError.message}`);
    }
    console.log(`✅ Berhasil memasukkan ${usersData?.length || 0} user.`);

    // 2. Seed Categories (upsert berdasarkan name)
    console.log('🏷️  Seeding tabel `categories`...');
    let categoryMap = {};
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .upsert(seedCategories, { onConflict: 'name' })
      .select();

    if (categoriesError) {
      console.warn(`⚠️  Peringatan seeding categories: ${categoriesError.message} (lewatkan jika belum migrasi)`);
    } else {
      console.log(`✅ Berhasil memasukkan ${categoriesData?.length || 0} kategori.`);
      categoryMap = (categoriesData || []).reduce((acc, cat) => {
        acc[cat.name] = cat.id;
        return acc;
      }, {});
    }

    // 3. Seed Foods
    console.log('🍔 Seeding tabel `products`...');
    const supplier = usersData.find((u) => u.role === 'supplier');
    const { data: foodsData, error: foodsError } = await supabase
      .from('products')
      .insert(seedFoods(supplier, categoryMap))
      .select();

    if (foodsError) {
      throw new Error(`Gagal seeding products: ${foodsError.message}`);
    }
    console.log(`✅ Berhasil memasukkan ${foodsData?.length || 0} item makanan.`);

    console.log('\n🎉 Seeding selesai dengan sukses!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat seeding:');
    console.error(error.message);
    process.exit(1);
  }
}

runSeed();
