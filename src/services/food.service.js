import { supabase } from '../config/supabase.js';
import { FoodModel } from '../models/food.model.js';
import { AppError } from '../utils/errors.js';

const assertOwner = (food, user) => {
  const isAdmin = user?.profile?.role === 'admin';
  if (!isAdmin && food.supplier_id && food.supplier_id !== user?.id) {
    throw new AppError('Anda tidak berhak mengubah produk ini.', 403);
  }
};

const calcDiscount = (original, discounted) =>
  original > 0 ? Math.round((1 - discounted / original) * 100) : 0;

const toInt = (v, label) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  if (isNaN(n) || n < 0) throw new AppError(`${label} harus berupa angka >= 0.`, 400);
  return Math.round(n);
};

/**
 * Terima payload FE (camelCase) atau snake_case, keluarkan kolom tabel `products`.
 * Hanya field yang dikirim yang diisi (aman untuk update parsial).
 */
const normalizeFoodPayload = (p = {}) => {
  const pick = (...keys) => keys.map((k) => p[k]).find((v) => v !== undefined);
  const out = {};

  const name = pick('name');
  if (name !== undefined) out.name = String(name).trim();

  const description = pick('description');
  if (description !== undefined) out.description = description ? String(description).trim() : null;

  const category = pick('category');
  if (category !== undefined) out.category = String(category).trim() || 'Makanan Berat';

  const orig = toInt(pick('original_price', 'originalPrice'), 'Harga asli');
  if (orig !== undefined) out.original_price = orig;
  const disc = toInt(pick('discount_price', 'discountPrice', 'harga', 'price'), 'Harga diskon');
  if (disc !== undefined) out.discount_price = disc;
  const stock = toInt(pick('stock'), 'Stok');
  if (stock !== undefined) out.stock = stock;

  const deadline = pick('pickup_deadline', 'pickupDeadline');
  if (deadline !== undefined) out.pickup_deadline = deadline || null;

  const image = pick('image_url', 'image');
  if (image !== undefined) out.image_url = image ? String(image).trim() : null;

  const safety = pick('safety_approved', 'safetyApproved');
  if (safety !== undefined) out.safety_approved = Boolean(safety);
  const active = pick('is_active', 'isActive');
  if (active !== undefined) out.is_active = Boolean(active);

  const supplierId = pick('supplier_id', 'supplierId');
  if (supplierId !== undefined) out.supplier_id = supplierId;
  const supplierName = pick('supplier_name', 'supplierName');
  if (supplierName !== undefined) out.supplier_name = supplierName;
  const outlet = pick('outlet');
  if (outlet !== undefined) out.outlet = outlet;
  const address = pick('address');
  if (address !== undefined) out.address = address;
  const tags = pick('tags');
  if (Array.isArray(tags)) out.tags = tags.map(String);

  return out;
};

export const foodService = {
  /**
   * Mendapatkan daftar semua barang dengan filter dan paginasi
   */
  async getAllFoods(filters = {}) {
    const { data, count } = await FoodModel.findAll(filters);

    const result = {
      items: data || [],
      total: count ?? (data?.length || 0),
    };

    if (filters.limit) {
      const limit = parseInt(filters.limit, 10);
      const page = parseInt(filters.page, 10) || 1;
      result.page = page;
      result.limit = limit;
      result.totalPages = Math.ceil(result.total / limit);
    }

    return result;
  },

  /**
   * Mendapatkan detail satu barang berdasarkan ID
   */
  async getFoodById(id) {
    if (!id) {
      throw new AppError('ID barang wajib disertakan.', 400);
    }

    const food = await FoodModel.findById(id);

    if (!food) {
      throw new AppError('Barang tidak ditemukan.', 404);
    }

    return food;
  },

  /**
   * Membuat barang baru dengan validasi bisnis
   */
  async createFood(payload, user) {
    const data = normalizeFoodPayload(payload);

    if (!data.name) throw new AppError('Nama barang (name) wajib diisi.', 400);
    if (data.discount_price === undefined) {
      throw new AppError('Harga diskon wajib diisi dengan angka valid.', 400);
    }

    const newFood = {
      original_price: data.discount_price,
      stock: 0,
      category: 'Makanan Berat',
      ...data,
      // supplier diambil dari token kalau ada, fallback ke payload
      supplier_id: user?.id ?? data.supplier_id ?? null,
    };

    // Data toko diambil dari profil supplier (bukan dari input form)
    const prof = user?.profile;
    if (prof) {
      newFood.supplier_name = prof.outlet || prof.name || newFood.supplier_name;
      newFood.address = prof.address || newFood.address || null;
      newFood.outlet = prof.address || newFood.outlet || null;
    }

    if (newFood.original_price < newFood.discount_price) {
      throw new AppError('Harga asli tidak boleh lebih kecil dari harga diskon.', 400);
    }
    newFood.discount = calcDiscount(newFood.original_price, newFood.discount_price);

    return await FoodModel.create(newFood);
  },

  /**
   * Memperbarui data barang
   */
  async updateFood(id, payload, user) {
    const existing = await this.getFoodById(id);
    assertOwner(existing, user);
    const updateData = normalizeFoodPayload(payload);
    delete updateData.supplier_id; // pemilik tidak boleh diganti lewat update

    if (updateData.name === '') throw new AppError('Nama barang tidak boleh kosong.', 400);
    if (Object.keys(updateData).length === 0) {
      throw new AppError('Tidak ada perubahan data yang dikirimkan.', 400);
    }

    if (updateData.original_price !== undefined || updateData.discount_price !== undefined) {
      const orig = updateData.original_price ?? existing.original_price;
      const disc = updateData.discount_price ?? existing.discount_price;
      if (orig < disc) throw new AppError('Harga asli tidak boleh lebih kecil dari harga diskon.', 400);
      updateData.discount = calcDiscount(orig, disc);
    }

    return await FoodModel.update(id, updateData);
  },

  /**
   * Menghapus data barang
   */
  async deleteFood(id, user) {
    const existing = await this.getFoodById(id);
    assertOwner(existing, user);
    return await FoodModel.delete(id);
  },

  /**
   * Upload gambar produk ke Supabase Storage, kembalikan URL publik
   */
  async uploadImage(file, user) {
    if (!file) throw new AppError('File gambar (field "image") wajib dikirim.', 400);

    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.mimetype];
    if (!ext) throw new AppError('Format gambar harus JPG, PNG, atau WebP.', 400);

    const path = `${user?.id || 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new AppError(`Gagal mengunggah gambar: ${error.message}`, 500);

    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return { image_url: data.publicUrl, path };
  },
};
