import { Router } from 'express';
import healthRoutes from './health.routes.js';
import foodRoutes from './food.routes.js';
import authRoutes from './auth.routes.js';
import purchaseRoutes from './purchase.routes.js';

const router = Router();

// Register sub-routes
router.use('/health', healthRoutes);
router.use('/products', foodRoutes);
router.use('/auth', authRoutes);
router.use('/purchase', purchaseRoutes);
export default router;
