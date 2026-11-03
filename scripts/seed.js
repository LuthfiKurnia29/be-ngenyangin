import { config } from '../src/config/env.js';
import { supabase } from '../src/config/supabase.js';

const seedUsers = [
  {
    name: 'Admin Ngenyangin',
    email: 'admin@ngenyangin.id',
    role: 'admin',
  },
  {
    name: 'Budi Santoso',
    email: 'budi@gmail.com',
    role: 'customer',
  },
  {
    name: 'Siti Rahma',
    email: 'siti@gmail.com',
    role: 'customer',
  },
];

const seedFoods = [
  {
    name: 'Nasi Goreng Spesial',
    description: 'Nasi goreng dengan telur, suwir ayam, dan acar segar',
    harga: 25000,
    stock: 50,
    category: 'Makanan Berat',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b',
  },
  {
    name: 'Ayam Bakar Madu',
    description: 'Ayam panggang bumbu madu khas Nusantara',
    harga: 32000,
    stock: 30,
    category: 'Makanan Berat',
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b',
  },
  {
    name: 'Es Teh Manis',
    description: 'Teh melati manis segar dingin',
    harga: 5000,
    stock: 100,
    category: 'Minuman',
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc',
  },
  {
    name: 'Pisang Goreng Crispy',
    description: 'Pisang raja goreng tepung renyah dengan topping keju cokelat',
    harga: 18000,
    stock: 40,
    category: 'Camilan',
    image_url: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c',
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

    // 2. Seed Foods
    console.log('🍔 Seeding tabel `products`...');
    const { data: foodsData, error: foodsError } = await supabase
      .from('products')
      .upsert(seedFoods, { onConflict: 'name' })
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

