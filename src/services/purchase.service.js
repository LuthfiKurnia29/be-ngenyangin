import { supabase } from '../config/supabase.js';
import { PurchaseModel } from '../models/purchase.model.js';
import { AppError } from '../utils/errors.js';

export const purchaseService = {
    async createPurchase(user_id, total_price, date, productId) {
        try {
            // create purchase
            await PurchaseModel.create(user_id, total_price, date, productId);
        } catch (error) {
            throw new AppError(error.message, error.status);
        }
    }
}