import { purchaseService } from '../services/purchase.service.js';
import { successResponse } from '../utils/response.js';

/**
 * Langkah 1: Buat order pesanan
 */
export const createPurchase = async (req, res, next) => {
  try {
    const user = req.user || res.locals?.user;
    const order = await purchaseService.createPurchase(req.body, user);
    return successResponse(res, 201, 'Pesanan berhasil dibuat. Silakan lanjutkan ke pembayaran.', order);
  } catch (error) {
    next(error);
  }
};

/**
 * Langkah 2: Tombol "Bayar Sekarang" -> Inisiasi pembayaran & buat Snap Token Midtrans
 */
export const createPayment = async (req, res, next) => {
  try {
    const user = req.user || res.locals?.user;
    const paymentData = await purchaseService.createPayment(req.params.id, user);
    return successResponse(res, 200, 'Token pembayaran Midtrans berhasil dibuat', paymentData);
  } catch (error) {
    next(error);
  }
};

/**
 * Webhook callback dari Midtrans
 */
export const handleNotification = async (req, res, next) => {
  try {
    const result = await purchaseService.handleMidtransNotification(req.body);
    // Midtrans membutuhkan HTTP 200 OK sebagai konfirmasi bahwa webhook diterima
    return res.status(200).json({
      status: 'success',
      message: 'Notifikasi Midtrans berhasil diproses',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const checkPaymentStatus = async (req, res, next) => {
  try {
    const user = req.user || res.locals?.user;
    const statusData = await purchaseService.checkPaymentStatus(req.params.id, user);
    return successResponse(res, 200, 'Status pembayaran berhasil diperiksa', statusData);
  } catch (error) {
    next(error);
  }
};

export const getAllPurchases = async (req, res, next) => {
  try {
    const user = req.user || res.locals?.user;
    const orders = await purchaseService.getAllPurchases(req.query, user);
    return successResponse(res, 200, 'Daftar pesanan berhasil diambil', orders);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    const user = req.user || res.locals?.user;
    const order = await purchaseService.getPurchaseById(req.params.id, user);
    return successResponse(res, 200, 'Detail pesanan berhasil diambil', order);
  } catch (error) {
    next(error);
  }
};

export const updatePurchase = async (req, res, next) => {
  try {
    const user = req.user || res.locals?.user;
    const order = await purchaseService.updatePurchase(req.params.id, req.body, user);
    return successResponse(res, 200, 'Pesanan berhasil diperbarui', order);
  } catch (error) {
    next(error);
  }
};

export const deletePurchase = async (req, res, next) => {
  try {
    const user = req.user || res.locals?.user;
    const order = await purchaseService.deletePurchase(req.params.id, user);
    return successResponse(res, 200, 'Pesanan berhasil dihapus', order);
  } catch (error) {
    next(error);
  }
};
