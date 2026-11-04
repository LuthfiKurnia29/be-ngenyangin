import { Router } from 'express';
import {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  uploadFoodImage,
} from '../controllers/product.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { imageUpload } from '../middlewares/upload.js';

const router = Router();

// GET semua produk (filter: category, search, supplier_id, limit, page)
router.get('/', getAllFoods);

// POST upload gambar (harus sebelum '/:id')
router.post('/upload', requireAuth, imageUpload.single('image'), uploadFoodImage);

// GET detail produk
router.get('/:id', getFoodById);

// POST tambah produk (supplier_id diambil dari token)
router.post('/', requireAuth, createFood);

// PUT update produk
router.put('/:id', requireAuth, updateFood);

// DELETE hapus produk
router.delete('/:id', requireAuth, deleteFood);

export default router;
