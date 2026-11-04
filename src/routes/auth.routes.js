import { Router } from 'express';
import { login, logout, getMe, register, updateProfile, uploadAvatar } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { imageUpload } from '../middlewares/upload.js';

const router = Router();

// Endpoint Registrasi (Sign Up)
router.post('/register', register);

// Endpoint Login (Sign In)
router.post('/login', login);

// Endpoint Logout (Sign Out)
router.post('/logout', logout);

// Endpoint Get Current User Session (Protected)
router.get('/me', requireAuth, getMe);

// Endpoint Update Profil (Protected)
router.put('/profile', requireAuth, updateProfile);

// Upload foto profil (multipart, field: image)
router.post('/avatar', requireAuth, imageUpload.single('image'), uploadAvatar);

export default router;

