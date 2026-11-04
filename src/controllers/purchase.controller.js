import { purchaseService } from '../services/purchase.service.js';
// import { detailPurchaseService } from '../services/detailPurchase.service.js';
import { successResponse } from '../utils/response.js';

export const createPurchase = async (req, res, next) => {
    try {
        const user = res.locals.user;

        const order = await purchaseService.createPurchase(req.body, user);
        // const detail = await detailPurchaseService.addDetail(order.id, req.body.productId, req.body.jumlah,);
        successResponse(res, order, 'Order created successfully', 201);
    } catch (error) {
        next(error);
    }
}

export const updatePurchase = async (req, res, next) => {
    try {
        const user = res.locals.user;
        const order = await purchaseService.updatePurchase(req.body, user);
        successResponse(res, order, 'Order updated successfully', 200);
    } catch (error) {
        next(error);
    }
}

export const getPurchaseById = async (req, res, next) => {
    try {
        const user = res.locals.user;
        const order = await purchaseService.getPurchaseById(req.params.id, user);
        successResponse(res, order, 'Order fetched successfully', 200);
    } catch (error) {
        next(error);
    }
}

export const deletePurchase = async (req, res, next) => {
    try {
        const user = res.locals.user;
        const order = await purchaseService.deletePurchase(req.params.id, user);
        successResponse(res, order, 'Order deleted successfully', 200);
    } catch (error) {
        next(error);
    }
}