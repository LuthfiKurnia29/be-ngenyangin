import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from '../controllers/category.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { imageUpload } from '../middlewares/upload.js';

const router = Router();

// GET semua kategori (filter: search, limit, page, sortBy, order)
router.get('/', getAllCategories);

// POST upload icon/gambar kategori (harus sebelum '/:id')
router.post('/upload', requireAuth, imageUpload.single('image'), uploadCategoryImage);

// GET detail kategori
router.get('/:id', getCategoryById);

// POST tambah kategori baru (memerlukan auth)
router.post('/', requireAuth, createCategory);

// PUT update kategori (memerlukan auth)
router.put('/:id', requireAuth, updateCategory);

// DELETE hapus kategori (memerlukan auth)
router.delete('/:id', requireAuth, deleteCategory);

export default router;

