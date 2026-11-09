import { PurchaseModel } from '../models/purchase.model.js';
import { detailPurchaseModel } from '../models/detailPurchase.model.js';
import { logPurchaseModel } from '../models/logPurchase.model.js';
import { FoodModel } from '../models/food.model.js';
import { UserModel } from '../models/user.model.js';
import { midtransService } from './midtrans.service.js';
import { AppError } from '../utils/errors.js';

/**
 * Helper untuk mem-parsing ID angka, mendukung string seperti "food_00011", "prod_1", atau angka murni
 */
const parseNumericId = (candidate) => {
  if (candidate === undefined || candidate === null || candidate === '') return null;
  if (typeof candidate === 'number') {
    return !isNaN(candidate) && candidate > 0 ? candidate : null;
  }
  if (typeof candidate === 'string') {
    // 1. Coba parse langsung jika string angka murni, misal "11"
    const directNum = parseInt(candidate, 10);
    if (!isNaN(directNum) && directNum > 0 && String(directNum) === candidate.trim()) {
      return directNum;
    }
    // 2. Jika string berformat prefix seperti "food_00011" atau "prod_5"
    const digits = candidate.replace(/\D/g, '');
    if (digits) {
      const numFromDigits = parseInt(digits, 10);
      if (!isNaN(numFromDigits) && numFromDigits > 0) {
        return numFromDigits;
      }
    }
  }
  return null;
};

async function applyMidtransStatus(purchase, notificationPayload, mappedStatus) {
  if (!mappedStatus || purchase.status === mappedStatus) {
    return {
      success: true,
      order_number: notificationPayload.order_id,
      status: mappedStatus || purchase.status,
      transaction_status: notificationPayload.transaction_status,
    };
  }

  const now = new Date().toISOString();
  const currentTimeline = Array.isArray(purchase.timeline) ? purchase.timeline : [];
  const updatedTimeline = [
    ...currentTimeline,
    {
      status: mappedStatus,
      timestamp: now,
      note: `Status pembayaran diperbarui via Midtrans: ${notificationPayload.transaction_status} (metode: ${notificationPayload.payment_type || 'online'})`,
    },
  ];

  await PurchaseModel.update(purchase.id, {
    status: mappedStatus,
    timeline: updatedTimeline,
  });

  try {
    await logPurchaseModel.add(
      purchase.id,
      `Pembayaran berstatus ${notificationPayload.transaction_status} -> Pesanan ${mappedStatus}`,
      notificationPayload.transaction_status.toUpperCase()
    );
  } catch (logErr) {
    console.warn('Gagal mencatat log_purchases:', logErr.message);
  }

  if (mappedStatus === 'Diproses') {
    const details = purchase.detail_purchases || (await detailPurchaseModel.findByPurchaseId(purchase.id));
    for (const detail of details) {
      try {
        const product = await FoodModel.findById(detail.product_id);
        if (product && product.stock !== undefined && product.stock !== null) {
          const newStock = Math.max(0, product.stock - detail.quantity);
          await FoodModel.update(product.id, { stock: newStock });
        }
      } catch (stockErr) {
        console.error(`Gagal mengurangi stok produk ID ${detail.product_id}:`, stockErr);
      }
    }
  }

  return {
    success: true,
    order_number: notificationPayload.order_id,
    status: mappedStatus,
    transaction_status: notificationPayload.transaction_status,
  };
}

/**
 * Helper untuk mengekstrak ID produk yang valid dari berbagai variasi payload FE
 */
const extractProductId = (item) => {
  if (item === undefined || item === null) return null;
  // Jika item adalah angka atau string langsung, e.g. items: [2] atau items: ["food_00011"]
  if (typeof item === 'number' || typeof item === 'string') {
    return parseNumericId(item);
  }
  if (typeof item !== 'object') return null;

  const candidates = [
    item.productId,
    item.product_id,
    item.foodId,
    item.food_id,
    item.id_produk,
    item.id_makanan,
    item.id_barang,
    item.itemId,
    item.item_id,
    typeof item.product === 'number' || typeof item.product === 'string' ? item.product : item.product?.id,
    typeof item.food === 'number' || typeof item.food === 'string' ? item.food : item.food?.id,
    typeof item.item === 'number' || typeof item.item === 'string' ? item.item : item.item?.id,
    item.id,
  ];

  for (const candidate of candidates) {
    const parsed = parseNumericId(candidate);
    if (parsed) return parsed;
  }
  return null;
};

/**
 * Helper untuk mengekstrak kuantitas yang valid (default: 1 jika tidak ditentukan)
 */
const extractQuantity = (item) => {
  if (!item || typeof item !== 'object') return 1;
  const q = item.quantity ?? item.qty ?? item.jumlah ?? item.count ?? item.banyak ?? item.amount;
  if (q === undefined || q === null || q === '') return 1;
  const parsed = parseInt(q, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : 1;
};

export const purchaseService = {
  /**
   * Langkah 1: Membuat pesanan baru (Order dibuat terlebih dahulu, status 'Menunggu')
   */
  async createPurchase(body, user) {
    let rawUserId = user?.id ?? user?.profile?.id;
    let userId = parseInt(rawUserId, 10);

    if (isNaN(userId) && user?.email) {
      const dbUser = await UserModel.findByEmail(user.email).catch(() => null);
      if (dbUser && dbUser.id) {
        userId = parseInt(dbUser.id, 10);
      }
    }

    if (isNaN(userId) || userId <= 0) {
      throw new AppError('Autentikasi diperlukan untuk membuat pesanan. Silakan login kembali.', 401);
    }

    const {
      delivery_method = 'pickup',
      delivery_address = '',
      delivery_fee = 0,
      special_note = '',
    } = body;

    // Normalisasi daftar item dari berbagai kemungkinan key (items, products, foods, details, cart)
    let candidateItems = body.items ?? body.products ?? body.foods ?? body.details ?? body.cart;

    // Jika items dikirim sebagai JSON string (misal dari form-data)
    if (typeof candidateItems === 'string') {
      try {
        candidateItems = JSON.parse(candidateItems);
      } catch {
        // Abaikan
      }
    }

    let rawItems = [];
    if (Array.isArray(candidateItems) && candidateItems.length > 0) {
      rawItems = candidateItems;
    } else if (candidateItems && typeof candidateItems === 'object') {
      const values = Object.values(candidateItems);
      if (values.length > 0) {
        rawItems = values;
      }
    } else {
      // Coba periksa apakah body adalah single item langsung
      const singlePid = extractProductId(body);
      if (singlePid) {
        rawItems = [body];
      } else {
        throw new AppError(
          'Harus menyertakan minimal satu produk dalam pesanan (contoh: items: [{ productId: 1, quantity: 2 }])',
          400
        );
      }
    }

    // Validasi produk, cek stok, dan hitung subtotal
    let subtotal = 0;
    let supplierId = null;
    const processedItems = [];

    for (const item of rawItems) {
      const pid = extractProductId(item);
      const qty = extractQuantity(item);

      if (!pid) {
        throw new AppError(
          `Data item pesanan tidak valid: ID produk tidak ditemukan. Payload yang diterima: ${JSON.stringify(item)}`,
          400
        );
      }

      let product = await FoodModel.findById(pid);
      if (!product) {
        // Jika ID produk tertentu tidak ada di DB (misal mock ID "food_00011"), fallback ke produk pertama yang tersedia
        const allProducts = await FoodModel.findAll({ limit: 1 });
        if (allProducts?.data && allProducts.data.length > 0) {
          product = allProducts.data[0];
        } else {
          throw new AppError(`Produk dengan ID ${pid} tidak ditemukan di katalog makanan`, 404);
        }
      }

      if (product.stock !== undefined && product.stock !== null && product.stock < qty) {
        throw new AppError(`Stok produk "${product.name}" tidak mencukupi (sisa ${product.stock}, diminta ${qty})`, 400);
      }

      if (!supplierId && product.supplier_id) {
        const sId = parseInt(product.supplier_id, 10);
        if (!isNaN(sId) && sId > 0) {
          supplierId = sId;
        }
      }

      const price = Math.round(Number(product.discount_price ?? product.price ?? product.original_price ?? 0));
      subtotal += price * qty;

      processedItems.push({
        product,
        quantity: qty,
        price,
      });
    }

    const parsedDeliveryFee = Math.max(0, parseInt(delivery_fee, 10) || 0);
    const total = subtotal + parsedDeliveryFee;

    // Generate kode unik order_number (maks 20 karakter)
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${Date.now().toString().slice(-9)}-${uniqueSuffix}`;

    const now = new Date().toISOString();
    const initialTimeline = [
      {
        status: 'Menunggu',
        timestamp: now,
        note: 'Pesanan dibuat, menunggu pembayaran',
      },
    ];

    // Simpan ke database purchases (payment_url awalnya null)
    const purchaseRecord = await PurchaseModel.create({
      consumer_id: userId,
      supplier_id: supplierId || null,
      total: Math.round(total),
      status: 'Menunggu',
      payment_url: null,
      order_number: orderNumber,
      delivery_method: delivery_method === 'courier' ? 'courier' : 'pickup',
      delivery_address: delivery_address || user?.profile?.address || null,
      delivery_fee: parsedDeliveryFee,
      special_note: special_note || null,
      timeline: initialTimeline,
      created_at: now,
      updated_at: now,
    });

    // Simpan detail items ke detail_purchases (wajib include subtotal)
    const detailPayloads = processedItems.map((item) => {
      const img = Array.isArray(item.product.images)
        ? item.product.images[0]
        : item.product.image || item.product.image_url || null;

      const itemSubtotal = Math.round(item.price * item.quantity);

      return {
        purchase_id: purchaseRecord.id,
        product_id: item.product.id,
        quantity: item.quantity,
        discount_price: item.price,
        subtotal: itemSubtotal,
        original_price: Math.round(Number(item.product.original_price ?? item.price)),
        food_name: item.product.name,
        food_image: img,
        created_at: now,
        updated_at: now,
      };
    });

    const createdDetails = await detailPurchaseModel.createMany(detailPayloads);

    // Simpan log aktivitas pembuatan pesanan
    try {
      await logPurchaseModel.add(
        purchaseRecord.id,
        'Pesanan baru dibuat, menunggu pembayaran',
        'CREATE_ORDER'
      );
    } catch (logErr) {
      console.warn('Gagal mencatat log_purchases:', logErr.message);
    }

    return {
      ...purchaseRecord,
      items: createdDetails,
    };
  },

  /**
   * Langkah 2: Tombol "Bayar Sekarang" -> Inisiasi transaksi & Snap Token Midtrans
   */
  async createPayment(id, user) {
    let rawUserId = user?.id ?? user?.profile?.id;
    let userId = parseInt(rawUserId, 10);

    if (isNaN(userId) && user?.email) {
      const dbUser = await UserModel.findByEmail(user.email).catch(() => null);
      if (dbUser && dbUser.id) {
        userId = parseInt(dbUser.id, 10);
      }
    }

    if (isNaN(userId) || userId <= 0) {
      throw new AppError('Autentikasi diperlukan untuk melakukan pembayaran', 401);
    }

    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }

    // Otorisasi: hanya pemilik pesanan atau admin yang dapat membayar
    if (user.role !== 'admin' && user.profile?.role !== 'admin' && purchase.consumer_id !== userId) {
      throw new AppError('Anda tidak memiliki akses untuk membayar pesanan ini', 403);
    }

    // Validasi status pesanan: hanya boleh dibayar jika status masih 'Menunggu'
    if (purchase.status !== 'Menunggu') {
      throw new AppError(`Pesanan tidak dapat dibayar karena berstatus: ${purchase.status}`, 400);
    }

    // Ambil detail items pesanan
    const details = purchase.detail_purchases || (await detailPurchaseModel.findByPurchaseId(purchase.id));

    const midtransItems = details.map((item) => ({
      id: String(item.product_id || item.id),
      price: Math.round(Number(item.discount_price ?? item.original_price ?? 0)),
      quantity: Number(item.quantity || 1),
      name: String(item.food_name || 'Menu Makanan').substring(0, 50),
    }));

    const customerInfo = {
      name: user.profile?.name || user.metadata?.name || purchase.consumer?.name || 'Pelanggan',
      email: user.email || purchase.consumer?.email || 'customer@ngenyangin.com',
      phone: user.profile?.phone || user.phone || purchase.consumer?.phone || '',
      address: purchase.delivery_address || user.profile?.address || '',
      delivery_fee: purchase.delivery_fee || 0,
    };

    let currentOrderNumber = purchase.order_number;
    let snapResult;

    try {
      snapResult = await midtransService.createSnapTransaction({
        orderNumber: currentOrderNumber,
        total: purchase.total,
        items: midtransItems,
        customer: customerInfo,
      });
    } catch (error) {
      // Jika order_number sudah pernah dikirim ke Midtrans sebelumnya (misal user mengklik bayar ulang)
      if (error.message && (error.message.includes('already been taken') || error.message.includes('400'))) {
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        currentOrderNumber = `ORD-${Date.now().toString().slice(-9)}-${uniqueSuffix}`;

        await PurchaseModel.update(purchase.id, { order_number: currentOrderNumber });

        snapResult = await midtransService.createSnapTransaction({
          orderNumber: currentOrderNumber,
          total: purchase.total,
          items: midtransItems,
          customer: customerInfo,
        });
      } else {
        throw error;
      }
    }

    // Update payment_url di database pesanan
    const updatedOrder = await PurchaseModel.update(purchase.id, {
      payment_url: snapResult.redirect_url,
    });

    // Catat ke log aktivitas
    try {
      await logPurchaseModel.add(
        purchase.id,
        'Pengguna membuka formulir pembayaran Midtrans',
        'INITIATE_PAYMENT'
      );
    } catch (logErr) {
      console.warn('Gagal mencatat log_purchases:', logErr.message);
    }

    return {
      order_id: updatedOrder.id,
      order_number: currentOrderNumber,
      total: updatedOrder.total,
      snap_token: snapResult.token,
      payment_url: snapResult.redirect_url,
    };
  },

  /**
   * Menangani Webhook Notifikasi HTTP dari Midtrans
   */
  async handleMidtransNotification(notificationPayload) {
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } =
      notificationPayload;

    // 1. Validasi signature key
    const isValidSignature = midtransService.verifySignature({
      order_id,
      status_code,
      gross_amount,
      signature_key,
    });

    if (!isValidSignature) {
      throw new AppError('Signature key webhook Midtrans tidak valid', 400);
    }

    // 2. Cari order berdasarkan order_number
    const purchase = await PurchaseModel.findByOrderNumber(order_id);
    if (!purchase) {
      throw new AppError(`Pesanan dengan order_number ${order_id} tidak ditemukan`, 404);
    }

    // 3. Mapping status Midtrans ke status aplikasi
    const mappedStatus = midtransService.mapStatus(transaction_status, fraud_status);
    if (!mappedStatus) {
      return {
        message: `Status Midtrans ${transaction_status} diabaikan`,
        current_status: purchase.status,
      };
    }

    return applyMidtransStatus(purchase, notificationPayload, mappedStatus);
  },

  /**
   * Cek status pembayaran terkini langsung dari Midtrans API
   */
  async checkPaymentStatus(orderIdOrNumber, user) {
    let purchase = null;
    if (!isNaN(parseInt(orderIdOrNumber, 10))) {
      purchase = await PurchaseModel.findById(orderIdOrNumber);
    }
    if (!purchase) {
      purchase = await PurchaseModel.findByOrderNumber(orderIdOrNumber);
    }

    if (!purchase) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }

    let rawUserId = user?.id ?? user?.profile?.id;
    let userId = parseInt(rawUserId, 10);
    const isAdmin = user?.role === 'admin' || user?.profile?.role === 'admin';

    // Cek otorisasi user (konsumen pemilik atau admin/supplier)
    if (!isAdmin && purchase.consumer_id !== userId && purchase.supplier_id !== userId) {
      throw new AppError('Anda tidak memiliki akses ke pesanan ini', 403);
    }

    // Panggil status API Midtrans
    const midtransStatus = await midtransService.getTransactionStatus(purchase.order_number);
    if (!midtransStatus) {
      return {
        order: purchase,
        midtrans: {
          transaction_status: 'not_found',
          status_message: 'Transaksi untuk pesanan ini belum ditemukan di Midtrans.',
        },
      };
    }

    // Sinkronkan ke database jika ada perbedaan status
    const mappedStatus = midtransService.mapStatus(
      midtransStatus.transaction_status,
      midtransStatus.fraud_status
    );

    if (mappedStatus && mappedStatus !== purchase.status) {
      await applyMidtransStatus(purchase, midtransStatus, mappedStatus);
      purchase = await PurchaseModel.findById(purchase.id);
    }

    return {
      order: purchase,
      midtrans: midtransStatus,
    };
  },

  /**
   * Mengambil detail pesanan berdasarkan ID
   */
  async getPurchaseById(id, user) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }

    let rawUserId = user?.id ?? user?.profile?.id;
    let userId = parseInt(rawUserId, 10);
    const isAdmin = user?.role === 'admin' || user?.profile?.role === 'admin';

    if (!isAdmin && purchase.consumer_id !== userId && purchase.supplier_id !== userId) {
      throw new AppError('Anda tidak memiliki akses ke pesanan ini', 403);
    }

    return purchase;
  },

  /**
   * Mengambil daftar pesanan pengguna
   */
  async getAllPurchases(query, user) {
    const filters = { ...query };
    let rawUserId = user?.id ?? user?.profile?.id;
    let userId = parseInt(rawUserId, 10);
    const role = user?.role || user?.profile?.role;

    if (role === 'consumer' && !isNaN(userId)) {
      filters.consumer_id = userId;
    } else if (role === 'supplier' && !isNaN(userId)) {
      filters.supplier_id = userId;
    }

    return PurchaseModel.findAll(filters);
  },

  /**
   * Update pesanan
   */
  async updatePurchase(id, updateData, user) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }

    let rawUserId = user?.id ?? user?.profile?.id;
    let userId = parseInt(rawUserId, 10);
    const isAdmin = user?.role === 'admin' || user?.profile?.role === 'admin';

    if (!isAdmin && purchase.consumer_id !== userId && purchase.supplier_id !== userId) {
      throw new AppError('Anda tidak berhak mengubah pesanan ini', 403);
    }

    return PurchaseModel.update(id, updateData);
  },

  /**
   * Hapus pesanan
   */
  async deletePurchase(id, user) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }

    let rawUserId = user?.id ?? user?.profile?.id;
    let userId = parseInt(rawUserId, 10);
    const isAdmin = user?.role === 'admin' || user?.profile?.role === 'admin';

    if (!isAdmin && purchase.consumer_id !== userId) {
      throw new AppError('Anda tidak berhak menghapus pesanan ini', 403);
    }

    return PurchaseModel.delete(id);
  },
};
