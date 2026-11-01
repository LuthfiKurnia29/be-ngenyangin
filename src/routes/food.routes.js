import { Router } from 'express';
import {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} from '../controllers/food.controller.js';

const router = Router();

// GET semua data barang / makanan (mendukung query filter & paginasi)
router.get('/', getAllFoods);

// GET detail satu data barang / makanan
router.get('/:id', getFoodById);

// POST tambah data barang / makanan baru
router.post('/', createFood);

// PUT update data barang / makanan
router.put('/:id', updateFood);

// DELETE hapus data barang / makanan
router.delete('/:id', deleteFood);

export default router;
