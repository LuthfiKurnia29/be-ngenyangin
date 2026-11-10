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
    // ratakan profil supaya FE langsung dapat name, phone, address, role, dst.
    const { profile, ...session } = req.user;
    return successResponse(res, 200, 'Berhasil mengambil data sesi user.', {
      user: {
        ...profile,
        id: session.id,
        auth_id: session.authId,
        email: session.email,
        phone: profile?.phone || '',
        address: profile?.address || '',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update profil user yang sedang login
 * PUT /api/v1/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user, req.body);
    return successResponse(res, 200, 'Profil berhasil diperbarui.', { user });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload foto profil ke Supabase Storage (bucket: avatars)
 * POST /api/v1/auth/avatar  (multipart/form-data, field: image)
 */
export const uploadAvatar = async (req, res, next) => {
  try {
    const data = await authService.uploadAvatar(req.file, req.user);
    return successResponse(res, 201, 'Berhasil mengunggah foto profil.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Lupa Password - Kirim token reset via email
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body);
    return successResponse(res, 200, data.message);
  } catch (err) {
    next(err);
  }
};

/**
 * Verifikasi token reset password
 * POST /api/v1/auth/verify-reset-token
 */
export const verifyResetToken = async (req, res, next) => {
  try {
    const data = await authService.verifyResetToken(req.body);
    return successResponse(res, 200, 'Token reset password valid.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const data = await authService.resetPassword(req.body);
    return successResponse(res, 200, data.message);
  } catch (err) {
    next(err);
  }
};
