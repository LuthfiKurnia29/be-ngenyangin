import { Router } from 'express';
import {
  getAdminContent,
  getPublicContent,
  saveAdminContent,
} from '../controllers/siteContent.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/admin', requireAuth, getAdminContent);
router.put('/admin/:type/:audience', requireAuth, saveAdminContent);
router.get('/:type/:audience', getPublicContent);

export default router;
