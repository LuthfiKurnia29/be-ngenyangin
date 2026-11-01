import { authService } from '../services/auth.service.js';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware untuk memvalidasi token JWT Supabase dari Header Authorization
 * Header: Authorization: Bearer <access_token>
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        401,
        'Akses ditolak. Token autentikasi tidak ditemukan di header Authorization (Bearer <token>).'
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 401, 'Token autentikasi tidak valid.');
    }

    // Verifikasi sesi melalui authService
    const userSession = await authService.verifySession(token);

    req.user = userSession;
    req.token = token;

    next();
  } catch (err) {
    next(err);
  }
};
