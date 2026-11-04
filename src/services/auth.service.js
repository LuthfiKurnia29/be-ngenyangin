import { supabase } from '../config/supabase.js';
import { config } from '../config/env.js';
import { UserModel } from '../models/user.model.js';
import { AppError } from '../utils/errors.js';

const toProfile = (profile, fallback = {}) => ({
  id: profile?.id ?? fallback.id ?? null,
  name: profile?.name,
  email: profile?.email ?? fallback.email,
  role: profile?.role,
  phone: profile?.phone || '',
  address: profile?.address || '',
  gender: profile?.gender || null,
  outlet: profile?.outlet || '',
  description: profile?.description || '',
  avatar: profile?.avatar || null,
  created_at: profile?.created_at,
});

export const authService = {
  /**
   * Pendaftaran akun baru
   */
  async register({ name, email, password, phone, gender, role = 'consumer' }) {
    if (!email || !password) {
      throw new AppError('Email dan password wajib diisi.', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password minimal harus 6 karakter.', 400);
    }

    if (!['consumer', 'supplier'].includes(role)) {
      throw new AppError('Peran hanya boleh consumer atau supplier.', 400);
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
        name: userName,
        email,
        role,
        phone: phone || null,
        gender: role === 'consumer' && ['male', 'female'].includes(gender) ? gender : null,
      });
    } catch (err) {
      console.warn('Gagal menyimpan profil user ke tabel users:', err.message);
    }

    return {
      user: {
        id: profile?.id ?? null,
        auth_id: authUser.id,
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
    let profile = await UserModel.findByEmail(email).catch(() => null);
    if (!profile) {
      // akun Auth sudah ada tapi belum punya baris di tabel users -> buatkan
      profile = await UserModel.upsert({
        name: user.user_metadata?.name || email.split('@')[0],
        email,
        role: user.user_metadata?.role || 'consumer',
      }).catch(() => null);
    }

    const userData = {
      id: profile?.id ?? null,
      auth_id: user.id,
      name: profile?.name || user.user_metadata?.name || email.split('@')[0],
      email: user.email,
      role: profile?.role || user.user_metadata?.role || 'consumer',
      phone: profile?.phone || '',
      address: profile?.address || '',
      gender: profile?.gender || null,
      outlet: profile?.outlet || '',
      description: profile?.description || '',
      avatar: profile?.avatar || null,
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
  async updateProfile(currentUser, { name, phone, address, gender, outlet, description, avatar }) {
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

    if (gender !== undefined) {
      if (gender && !['male', 'female'].includes(gender)) {
        throw new AppError('Jenis kelamin harus male atau female.', 400);
      }
      updateData.gender = gender || null;
    }

    // Data toko hanya untuk supplier
    const role = currentUser.profile?.role;
    if (role === 'supplier') {
      if (outlet !== undefined) updateData.outlet = String(outlet).trim() || null;
      if (description !== undefined) updateData.description = String(description).trim() || null;
    }

    if (avatar !== undefined) {
      if (avatar && !/^https?:\/\//i.test(String(avatar))) {
        throw new AppError('URL foto profil tidak valid.', 400);
      }
      updateData.avatar = avatar ? String(avatar) : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Tidak ada perubahan data yang dikirimkan.', 400);
    }

    // Profil sudah ada -> UPDATE biasa (tidak menyentuh kolom lain / constraint NOT NULL).
    // Belum ada -> buat baris baru.
    const profile = currentUser.id
      ? await UserModel.update(currentUser.id, updateData)
      : await UserModel.upsert({
          email: currentUser.email,
          name: currentUser.profile?.name || currentUser.email.split('@')[0],
          role: currentUser.profile?.role || 'consumer',
          ...updateData,
        });

    return toProfile(profile, { id: currentUser.id, email: currentUser.email });
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
      id: profile?.id ?? null,
      authId: user.id,
      email: user.email,
      phone: user.phone,
      metadata: user.user_metadata,
      profile: profile || {
        name: user.user_metadata?.name || user.email?.split('@')[0],
        role: user.user_metadata?.role || 'consumer',
      },
    };
  },

  /**
   * Upload foto profil ke Supabase Storage, kembalikan URL publik
   */
  async uploadAvatar(file, user) {
    if (!file) throw new AppError('File gambar (field "image") wajib dikirim.', 400);
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.mimetype];
    if (!ext) throw new AppError('Format gambar harus JPG, PNG, atau WebP.', 400);

    const path = `${user?.id || 'anon'}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new AppError(`Gagal mengunggah foto: ${error.message}`, 500);

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return { avatar_url: data.publicUrl, path };
  },
};
