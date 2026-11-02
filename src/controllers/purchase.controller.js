import { purchaseService } from '../services/purchase.service.js';
import { successResponse } from '../utils/response.js';

export const createPurchase = async (req, res, next) => {
    try {
        const user = res.locals.user;

        const order = await purchaseService.createPurchase(req.body, user);
        successResponse(res, order, 'Order created successfully', 201);
    } catch (error) {
        next(error);
    }
}