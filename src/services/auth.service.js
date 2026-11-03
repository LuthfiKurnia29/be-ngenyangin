import { supabase } from '../config/supabase.js';
import { config } from '../config/env.js';
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

    // 1. Daftarkan user ke Supabase Auth.
    // Jika service role key tersedia, buat user via Admin API dengan email_confirm: true
    // supaya akun langsung terkonfirmasi (FE melakukan login otomatis setelah daftar).
    // Tanpa service role key, fallback ke signUp biasa (butuh "Confirm email" dimatikan di dashboard).
    const userMeta = { name: userName, role };
    const { data: authData, error: authError } = config.supabase.serviceRoleKey && supabase.auth.admin?.createUser
      ? await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: userMeta,
        })
      : await supabase.auth.signUp({
          email,
          password,
          options: { data: userMeta },
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
      phone: profile?.phone || '',
      address: profile?.address || '',
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
   * Update profil user yang sedang login (nama, no. HP, alamat)
   */
  async updateProfile(currentUser, { name, phone, address }) {
    const updateData = {};

    if (name !== undefined) {
      if (!String(name).trim()) {
        throw new AppError('Nama tidak boleh kosong.', 400);
      }
      updateData.name = String(name).trim();
    }

    if (phone !== undefined) {
      const cleaned = String(phone).replace(/[\s-]/g, '');
      if (cleaned && !/^(\+62|62|0)8[0-9]{8,12}$/.test(cleaned)) {
        throw new AppError('Nomor HP tidak valid. Contoh: 081234567890.', 400);
      }
      updateData.phone = cleaned || null;
    }

    if (address !== undefined) {
      updateData.address = String(address).trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Tidak ada perubahan data yang dikirimkan.', 400);
    }

    // upsert supaya tetap jalan walau baris profil belum ada di tabel users
    const profile = await UserModel.upsert({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.profile?.name || currentUser.email.split('@')[0],
      role: currentUser.profile?.role || 'customer',
      ...updateData,
    });

    return {
      id: currentUser.id,
      name: profile?.name,
      email: currentUser.email,
      role: profile?.role,
      phone: profile?.phone || '',
      address: profile?.address || '',
      created_at: profile?.created_at,
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

