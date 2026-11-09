import { Router } from 'express';
import {
  createComplaint,
  deleteComplaint,
  getComplaints,
  updateComplaint,
} from '../controllers/complaint.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', getComplaints);
router.post('/', createComplaint);
router.put('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);

export default router;
