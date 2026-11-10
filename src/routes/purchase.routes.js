import { Router } from 'express';
import {
  createPurchase,
  createPayment,
  handleNotification,
  checkPaymentStatus,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from '../controllers/purchase.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// 1. Webhook Notifikasi Midtrans (Publik - tanpa token JWT, diverifikasi melalui Signature Key)
router.post('/notification', handleNotification);

// 2. Transaksi & Status Pembayaran (Terautentikasi)
router.get('/', requireAuth, getAllPurchases);
router.post('/', requireAuth, createPurchase);
router.post('/:id/pay', requireAuth, createPayment); // Tombol "Bayar Sekarang"
router.get('/:id/status', requireAuth, checkPaymentStatus);
router.get('/:id', requireAuth, getPurchaseById);
router.put('/:id', requireAuth, updatePurchase);
router.delete('/:id', requireAuth, deletePurchase);

export default router;
