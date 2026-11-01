import { Router } from 'express';
import { login, logout, getMe, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Endpoint Registrasi (Sign Up)
router.post('/register', register);

// Endpoint Login (Sign In)
router.post('/login', login);

// Endpoint Logout (Sign Out)
router.post('/logout', logout);

// Endpoint Get Current User Session (Protected)
router.get('/me', requireAuth, getMe);

export default router;

