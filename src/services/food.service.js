import { FoodModel } from '../models/food.model.js';
import { AppError } from '../utils/errors.js';

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
  async createFood(payload) {
    const { name, description, harga, stock, category, image_url } = payload;

    if (!name || name.trim() === '') {
      throw new AppError('Nama barang (name) wajib diisi.', 400);
    }

    // if (price === undefined || price === null || isNaN(Number(price))) {
    //   throw new AppError('Harga barang (price) wajib diisi dengan angka valid.', 400);
    // }

    if (Number(harga) < 0) {
      throw new AppError('Harga barang tidak boleh bernilai negatif.', 400);
    }

    const newFoodData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      harga: parseFloat(harga),
      stock: stock !== undefined ? parseInt(stock, 10) : 0,
      is_empty: false,
    };

    if (newFoodData.stock < 0) {
      throw new AppError('Stok barang tidak boleh bernilai negatif.', 400);
    }

    return await FoodModel.create(newFoodData);
  },

  /**
   * Memperbarui data barang
   */
  async updateFood(id, payload) {
    // 1. Verifikasi barang ada
    await this.getFoodById(id);

    const { name, description, price, stock, category, image_url } = payload;
    const updateData = {};

    if (name !== undefined) {
      if (name.trim() === '') {
        throw new AppError('Nama barang tidak boleh kosong.', 400);
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0) {
        throw new AppError('Harga barang harus berupa angka positif.', 400);
      }
      updateData.price = parseFloat(price);
    }

    if (stock !== undefined) {
      if (isNaN(Number(stock)) || Number(stock) < 0) {
        throw new AppError('Stok barang harus berupa angka >= 0.', 400);
      }
      updateData.stock = parseInt(stock, 10);
    }

    if (category !== undefined) {
      updateData.category = category ? category.trim() : 'Umum';
    }

    if (image_url !== undefined) {
      updateData.image_url = image_url ? image_url.trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Tidak ada perubahan data yang dikirimkan.', 400);
    }

    return await FoodModel.update(id, updateData);
  },

  /**
   * Menghapus data barang
   */
  async deleteFood(id) {
    // Verifikasi barang ada sebelum dihapus
    await this.getFoodById(id);
    return await FoodModel.delete(id);
  },
};

