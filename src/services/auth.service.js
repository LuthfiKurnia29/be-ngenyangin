import { supabase } from '../config/supabase.js';
import { UserModel } from '../models/user.model.js';
import { AppError } from '../utils/errors.js';

export const authService = {
  /**
   * Pendaftaran akun baru
   */
  async register({ name, email, password, role = 'customer' }) {
    if (!email || !password) {
      throw new AppError('Email dan password wajib diisi.', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password minimal harus 6 karakter.', 400);
    }

    const userName = name || email.split('@')[0];

    // 1. Daftarkan user ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userName,
          role,
        },
      },
    });

    if (authError) {
      throw new AppError(authError.message, 400);
    }

    const authUser = authData.user;
    if (!authUser) {
      throw new AppError('Gagal membuat akun.', 400);
    }

    // 2. Simpan profil ke tabel users via UserModel
    let profile = null;
    try {
      profile = await UserModel.upsert({
        id: authUser.id,
        name: userName,
        email,
        role,
      });
    } catch (err) {
      console.warn('Gagal menyimpan profil user ke tabel users:', err.message);
    }

    return {
      user: {
        id: authUser.id,
        name: profile?.name || userName,
        email: authUser.email,
        role: profile?.role || role,
        created_at: profile?.created_at || authUser.created_at,
      },
      session: authData.session
        ? {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_in: authData.session.expires_in,
            token_type: authData.session.token_type,
          }
        : null,
    };
  },

  /**
   * Autentikasi user (Login)
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new AppError('Email dan password wajib diisi.', 400);
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const message =
        authError.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : authError.message;
      throw new AppError(message, 401);
    }

    const { user, session } = authData;

    // Ambil data profil dari database
    const profile = await UserModel.findByEmail(email).catch(() => null);

    const userData = {
      id: user.id,
      name: profile?.name || user.user_metadata?.name || email.split('@')[0],
      email: user.email,
      role: profile?.role || user.user_metadata?.role || 'customer',
      created_at: profile?.created_at || user.created_at,
    };

    return {
      user: userData,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
    };
  },

  /**
   * Mengakhiri sesi user (Logout)
   */
  async logout(token) {
    if (token) {
      try {
        if (supabase.auth?.admin?.signOut) {
          await supabase.auth.admin.signOut(token);
        } else {
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.warn('Gagal mencabut token Supabase:', err.message);
      }
    }
    return true;
  },

  /**
   * Verifikasi token session dan ambil user profile
   */
  async verifySession(token) {
    if (!token) {
      throw new AppError('Token autentikasi tidak ditemukan.', 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.', 401);
    }

    const profile = await UserModel.findByEmail(user.email).catch(() => null);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      metadata: user.user_metadata,
      profile: profile || {
        name: user.user_metadata?.name || user.email?.split('@')[0],
        role: user.user_metadata?.role || 'customer',
      },
    };
  },
};

