import { foodService } from '../services/food.service.js';
import { successResponse } from '../utils/response.js';

/**
 * Mengambil seluruh data barang / makanan
 * GET /api/v1/foods atau /api/v1/barang
 */
export const getAllFoods = async (req, res, next) => {
  try {
    const data = await foodService.getAllFoods(req.query);
    return successResponse(res, 200, 'Berhasil mengambil daftar barang / makanan', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Mengambil detail satu barang berdasarkan ID
 * GET /api/v1/foods/:id atau /api/v1/barang/:id
 */
export const getFoodById = async (req, res, next) => {
  try {
    const data = await foodService.getFoodById(req.params.id);
    return successResponse(res, 200, 'Berhasil mengambil detail barang', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Menambahkan data barang baru
 * POST /api/v1/foods atau /api/v1/barang
 */
export const createFood = async (req, res, next) => {
  try {
    const data = await foodService.createFood(req.body);
    return successResponse(res, 201, 'Berhasil menambahkan barang baru.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Memperbarui data barang berdasarkan ID
 * PUT /api/v1/foods/:id atau /api/v1/barang/:id
 */
export const updateFood = async (req, res, next) => {
  try {
    const data = await foodService.updateFood(req.params.id, req.body);
    return successResponse(res, 200, 'Berhasil memperbarui data barang.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Menghapus data barang berdasarkan ID
 * DELETE /api/v1/foods/:id atau /api/v1/barang/:id
 */
export const deleteFood = async (req, res, next) => {
  try {
    const data = await foodService.deleteFood(req.params.id);
    return successResponse(res, 200, 'Berhasil menghapus data barang.', data);
  } catch (err) {
    next(err);
  }
};
