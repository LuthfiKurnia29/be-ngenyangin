import { authService } from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';

/**
 * Register User Baru
 * POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return successResponse(res, 201, 'Registrasi berhasil.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Login User
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return successResponse(res, 200, 'Login berhasil.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Logout User
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = req.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    await authService.logout(token);
    return successResponse(res, 200, 'Berhasil logout.');
  } catch (err) {
    next(err);
  }
};

/**
 * Get User Session Aktif
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'Berhasil mengambil data sesi user.', {
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};
