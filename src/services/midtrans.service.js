import crypto from 'node:crypto';
import { snap, coreApi } from '../config/midtrans.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const midtransService = {
  /**
   * Buat Snap Transaction token & redirect URL di Midtrans
   */
  async createSnapTransaction({ orderNumber, total, items = [], customer = {} }) {
    try {
      const parameter = {
        transaction_details: {
          order_id: orderNumber,
          gross_amount: Math.round(Number(total)),
        },
      };

      // Item details (jika item dikirim dan totalnya cocok)
      if (items && items.length > 0) {
        const itemDetails = items.map((item, index) => ({
          id: String(item.id || item.product_id || index + 1),
          price: Math.round(Number(item.price || item.discount_price || item.original_price || 0)),
          quantity: Number(item.quantity || item.jumlah || 1),
          name: String(item.name || item.food_name || 'Item').substring(0, 50),
        }));

        // Tambah ongkir jika ada
        if (customer.delivery_fee && Number(customer.delivery_fee) > 0) {
          itemDetails.push({
            id: 'DELIVERY_FEE',
            price: Math.round(Number(customer.delivery_fee)),
            quantity: 1,
            name: 'Ongkos Kirim',
          });
        }

        const itemsTotal = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
        // Midtrans mensyaratkan sum(item_details) == gross_amount
        if (itemsTotal === parameter.transaction_details.gross_amount) {
          parameter.item_details = itemDetails;
        }
      }

      // Customer details
      parameter.customer_details = {
        first_name: customer.name || 'Pelanggan',
        email: customer.email || 'customer@example.com',
        phone: customer.phone || customer.phone_number || '',
        shipping_address: customer.address
          ? {
              address: customer.address,
              first_name: customer.name || 'Pelanggan',
              phone: customer.phone || customer.phone_number || '',
            }
          : undefined,
      };

      const transaction = await snap.createTransaction(parameter);
      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      };
    } catch (error) {
      throw new AppError(
        `Gagal membuat transaksi Midtrans: ${error.message || error}`,
        error.httpStatusCode || 500
      );
    }
  },

  /**
   * Verifikasi validitas signature key dari webhook Midtrans
   * signature = SHA512(order_id + status_code + gross_amount + ServerKey)
   */
  verifySignature({ order_id, status_code, gross_amount, signature_key }) {
    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return false;
    }

    const payload = `${order_id}${status_code}${gross_amount}${config.midtrans.serverKey}`;
    const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');

    return expectedSignature === signature_key;
  },

  /**
   * Cek status transaksi langsung dari Midtrans API
   */
  async getTransactionStatus(orderNumber) {
    try {
      const response = await coreApi.transaction.status(orderNumber);
      return response;
    } catch (error) {
      throw new AppError(
        `Gagal memeriksa status pembayaran Midtrans: ${error.message || error}`,
        error.httpStatusCode || 500
      );
    }
  },

  /**
   * Mapping status transaksi Midtrans ke status internal sistem Ngenyangin
   * Status ENUM di DB: 'Menunggu', 'Diproses', 'Siap Diambil', 'Dalam Pengantaran', 'Selesai', 'Dibatalkan'
   */
  mapStatus(transactionStatus, fraudStatus) {
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        return 'Menunggu';
      }
      return 'Diproses';
    }

    if (transactionStatus === 'settlement') {
      return 'Diproses';
    }

    if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      return 'Dibatalkan';
    }

    if (transactionStatus === 'pending') {
      return 'Menunggu';
    }

    return null;
  },
};

