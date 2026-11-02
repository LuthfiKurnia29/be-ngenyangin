import { Router } from 'express';
import { createPurchase, updatePurchase, getPurchaseById, deletePurchase } from '../controllers/purchase.controller.js';

const router = Router();

// GET semua data barang / makanan (mendukung query filter & paginasi)
// router.get('/', getAllFoods);

// GET detail satu data barang / makanan
router.get('/:id', getPurchaseById);

// POST tambah data barang / makanan baru
router.post('/', createPurchase);

// PUT update data barang / makanan
router.put('/:id', updatePurchase);

// DELETE hapus data barang / makanan
router.delete('/:id', deletePurchase);

export default router;