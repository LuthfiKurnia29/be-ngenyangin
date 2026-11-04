import { CategoryModel } from '../models/category.model.js';
import { AppError } from '../utils/errors.js';
import { supabase } from '../config/supabase.js';

/**
 * Normalisasi payload kategori (camelCase atau snake_case)
 */
const normalizeCategoryPayload = (p = {}) => {
  const pick = (...keys) => keys.map((k) => p[k]).find((v) => v !== undefined);
  const out = {};

  const name = pick('name');
  if (name !== undefined) out.name = String(name).trim();

  const description = pick('description');
  if (description !== undefined) out.description = description ? String(description).trim() : null;

  const image = pick('image_url', 'imageUrl', 'image', 'icon');
  if (image !== undefined) out.image_url = image ? String(image).trim() : null;

  return out;
};

export const categoryService = {
  /**
   * Mendapatkan daftar semua kategori dengan filter dan paginasi
   */
  async getAllCategories(query = {}) {
    const { search, sortBy = 'id', order = 'asc', limit, page } = query;
    const { data, count } = await CategoryModel.findAll({ search, sortBy, order, limit, page });

    const result = {
      items: data || [],
      total: count ?? (data?.length || 0),
    };

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10) || 1;
      result.page = parsedPage;
      result.limit = parsedLimit;
      result.totalPages = Math.ceil(result.total / parsedLimit);
    }

    return result;
  },

  /**
   * Mendapatkan detail satu kategori berdasarkan ID
   */
  async getCategoryById(id) {
    if (!id) {
      throw new AppError('ID kategori wajib disertakan.', 400);
    }

    const category = await CategoryModel.findById(id);
    if (!category) {
      throw new AppError('Kategori tidak ditemukan.', 404);
    }

    return category;
  },

  /**
   * Membuat kategori baru
   */
  async createCategory(payload) {
    const data = normalizeCategoryPayload(payload);

    if (!data.name) {
      throw new AppError('Nama kategori (name) wajib diisi.', 400);
    }

    // Periksa apakah nama kategori sudah digunakan
    const existing = await CategoryModel.findByName(data.name);
    if (existing) {
      throw new AppError(`Kategori dengan nama '${data.name}' sudah ada.`, 409);
    }

    return await CategoryModel.create(data);
  },

  /**
   * Memperbarui data kategori
   */
  async updateCategory(id, payload) {
    if (!id) {
      throw new AppError('ID kategori wajib disertakan.', 400);
    }

    const existing = await this.getCategoryById(id);
    const updateData = normalizeCategoryPayload(payload);

    if (updateData.name === '') {
      throw new AppError('Nama kategori tidak boleh kosong.', 400);
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Tidak ada perubahan data yang dikirimkan.', 400);
    }

    // Jika nama diganti, pastikan tidak konflik dengan kategori lain
    if (updateData.name && updateData.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await CategoryModel.findByName(updateData.name);
      if (duplicate && String(duplicate.id) !== String(existing.id)) {
        throw new AppError(`Kategori dengan nama '${updateData.name}' sudah ada.`, 409);
      }
    }

    return await CategoryModel.update(id, updateData);
  },

  /**
   * Menghapus kategori
   */
  async deleteCategory(id) {
    if (!id) {
      throw new AppError('ID kategori wajib disertakan.', 400);
    }

    await this.getCategoryById(id);
    return await CategoryModel.delete(id);
  },

  /**
   * Upload icon / gambar kategori ke Supabase Storage (bucket: product-images)
   */
  async uploadImage(file) {
    if (!file) throw new AppError('File gambar (field "image") wajib dikirim.', 400);

    const ext = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    }[file.mimetype];

    if (!ext) throw new AppError('Format gambar harus JPG, PNG, WebP, atau SVG.', 400);

    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) throw new AppError(`Gagal mengunggah gambar kategori: ${error.message}`, 500);

    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return { image_url: data.publicUrl, path };
  },
};

