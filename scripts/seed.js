import { config } from '../src/config/env.js';
import { supabase } from '../src/config/supabase.js';

// Data awal lengkap ada di database/seed.sql (disalin dari data FE).
// Skrip ini hanya seed ringan: user admin + beberapa produk contoh.
const seedUsers = [
  { name: 'Admin NGENYANGIN', email: 'admin@demo.id', role: 'admin', phone: '021-5555-0000' },
  { name: 'Ahmad Fauzan', email: 'supplier@demo.id', role: 'supplier', outlet: 'Bebek Madura Bu Siti',
    address: 'Jl. Tebet Raya No. 42, Jakarta Selatan' },
];

const seedFoods = (supplier) => [
  {
    supplier_id: supplier.id,
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

    // 2. Seed Foods
    console.log('🍔 Seeding tabel `products`...');
    const supplier = usersData.find((u) => u.role === 'supplier');
    const { data: foodsData, error: foodsError } = await supabase
      .from('products')
      .insert(seedFoods(supplier))
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

