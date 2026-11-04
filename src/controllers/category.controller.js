import { categoryService } from '../services/category.service.js';
import { successResponse } from '../utils/response.js';

/**
 * Mengambil daftar semua kategori
 * GET /api/v1/categories
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getAllCategories(req.query);
    return successResponse(res, 200, 'Berhasil mengambil daftar kategori', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Mengambil detail kategori berdasarkan ID
 * GET /api/v1/categories/:id
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const data = await categoryService.getCategoryById(req.params.id);
    return successResponse(res, 200, 'Berhasil mengambil detail kategori', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Membuat kategori baru
 * POST /api/v1/categories
 */
export const createCategory = async (req, res, next) => {
  try {
    const data = await categoryService.createCategory(req.body);
    return successResponse(res, 201, 'Berhasil menambahkan kategori baru.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Memperbarui data kategori berdasarkan ID
 * PUT /api/v1/categories/:id
 */
export const updateCategory = async (req, res, next) => {
  try {
    const data = await categoryService.updateCategory(req.params.id, req.body);
    return successResponse(res, 200, 'Berhasil memperbarui data kategori.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Menghapus kategori berdasarkan ID
 * DELETE /api/v1/categories/:id
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const data = await categoryService.deleteCategory(req.params.id);
    return successResponse(res, 200, 'Berhasil menghapus kategori.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Upload gambar / icon kategori
 * POST /api/v1/categories/upload
 */
export const uploadCategoryImage = async (req, res, next) => {
  try {
    const data = await categoryService.uploadImage(req.file);
    return successResponse(res, 201, 'Berhasil mengunggah gambar kategori.', data);
  } catch (err) {
    next(err);
  }
};

