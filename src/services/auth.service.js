import { supabase } from '../config/supabase.js';
import { config } from '../config/env.js';
import { UserModel } from '../models/user.model.js';
import { AppError } from '../utils/errors.js';
import {
  hashMD5,
  compareMD5,
  generateSessionToken,
  verifySessionToken,
} from '../utils/crypto.js';

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
  vehicle: profile?.vehicle || null,
  radius: profile?.radius || null,
  bag_status: profile?.bag_status || null,
  rating: profile?.rating || null,
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

    const allowedRoles = ['consumer', 'supplier', 'courier', 'admin'];
    if (!allowedRoles.includes(role)) {
      throw new AppError('Peran tidak valid.', 400);
    }

    const existingUser = await UserModel.findByEmail(email).catch(() => null);
    if (existingUser) {
      throw new AppError('Email sudah terdaftar. Silakan gunakan email lain atau login.', 400);
    }

    const userName = name || email.split('@')[0];
    const hashedPassword = hashMD5(password);

    // 1. Coba daftarkan user ke Supabase Auth (opsional/fail-safe)
    let authUser = null;
    let authSession = null;
    try {
      const userMeta = { name: userName, role };
      const { data: authData, error: authError } =
        config.supabase.serviceRoleKey && supabase.auth.admin?.createUser
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

      if (!authError && authData?.user) {
        authUser = authData.user;
        authSession = authData.session;
      }
    } catch (err) {
      console.warn('Registrasi Supabase Auth dilewati/gagal:', err.message);
    }

    // 2. Simpan profil ke tabel users via UserModel dengan password MD5
    let profile = null;
    try {
      profile = await UserModel.upsert({
        name: userName,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        gender: role === 'consumer' && ['male', 'female'].includes(gender) ? gender : null,
      });
    } catch (err) {
      console.warn('Gagal menyimpan profil user ke tabel users:', err.message);
      throw new AppError(`Gagal mendaftarkan user ke database: ${err.message}`, 500);
    }

    const userId = profile?.id ?? null;
    const sessionToken =
      authSession?.access_token ||
      generateSessionToken({
        id: userId,
        email,
        role: profile?.role || role,
      });

    return {
      user: {
        id: userId,
        auth_id: authUser?.id || (userId ? String(userId) : null),
        name: profile?.name || userName,
        email: profile?.email || email,
        role: profile?.role || role,
        phone: profile?.phone || '',
        address: profile?.address || '',
        gender: profile?.gender || null,
        outlet: profile?.outlet || '',
        description: profile?.description || '',
        vehicle: profile?.vehicle || null,
        radius: profile?.radius || null,
        bag_status: profile?.bag_status || null,
        rating: profile?.rating || null,
        avatar: profile?.avatar || null,
        created_at: profile?.created_at || authUser?.created_at || new Date().toISOString(),
      },
      session: {
        access_token: sessionToken,
        refresh_token: authSession?.refresh_token || sessionToken,
        expires_in: authSession?.expires_in || 7 * 24 * 3600,
        token_type: 'bearer',
      },
    };
  },

  /**
   * Autentikasi user (Login)
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new AppError('Email dan password wajib diisi.', 400);
    }

    // 1. Ambil data user dari database berdasarkan email
    const user = await UserModel.findByEmail(email).catch(() => null);
    if (!user) {
      throw new AppError('Email atau password salah.', 401);
    }

    // 2. Verifikasi hash MD5 password
    const hashedPassword = hashMD5(password);
    let isMatch = Boolean(user.password && user.password === hashedPassword);
    let supabaseSession = null;
    let supabaseUser = null;

    // Fallback: Jika di DB belum tersimpan password (atau hash belum MD5),
    // coba validasi via Supabase Auth jika tersedia, lalu simpan hash MD5-nya
    if (!isMatch) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!authError && authData?.user) {
          isMatch = true;
          supabaseUser = authData.user;
          supabaseSession = authData.session;
          // Sinkronisasi hash MD5 ke tabel users
          await UserModel.update(user.id, { password: hashedPassword }).catch(() => null);
        }
      } catch {
        // Abaikan error Supabase
      }
    }

    if (!isMatch) {
      throw new AppError('Email atau password salah.', 401);
    }

    // 3. Generate session token jika tidak ada sesi Supabase
    const sessionToken = generateSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const accessToken = supabaseSession?.access_token || sessionToken;
    const refreshToken = supabaseSession?.refresh_token || sessionToken;
    const expiresIn = supabaseSession?.expires_in || 7 * 24 * 3600;

    const userData = {
      id: user.id,
      auth_id: supabaseUser?.id || String(user.id),
      name: user.name || email.split('@')[0],
      email: user.email,
      role: user.role || 'consumer',
      phone: user.phone || '',
      address: user.address || '',
      gender: user.gender || null,
      outlet: user.outlet || '',
      description: user.description || '',
      vehicle: user.vehicle || null,
      radius: user.radius || null,
      bag_status: user.bag_status || null,
      rating: user.rating || null,
      avatar: user.avatar || null,
      created_at: user.created_at,
    };

    return {
      user: userData,
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        token_type: 'bearer',
      },
    };
  },

  /**
   * Update profil user yang sedang login (nama, no. HP, alamat)
   */
  async updateProfile(currentUser, { name, phone, address, gender, outlet, description, avatar, vehicle, radius, bag_status }) {
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

    // Data spesifik supplier
    const role = currentUser.profile?.role;
    if (role === 'supplier') {
      if (outlet !== undefined) updateData.outlet = String(outlet).trim() || null;
      if (description !== undefined) updateData.description = String(description).trim() || null;
    }

    // Data spesifik kurir
    if (role === 'courier') {
      if (vehicle !== undefined) updateData.vehicle = String(vehicle).trim() || null;
      if (radius !== undefined) updateData.radius = Number(radius) || null;
      if (bag_status !== undefined) updateData.bag_status = String(bag_status).trim() || null;
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

    // 1. Verifikasi dengan internal JWT token terlebih dahulu
    const jwtPayload = verifySessionToken(token);
    if (jwtPayload && jwtPayload.email) {
      const user = await UserModel.findByEmail(jwtPayload.email).catch(() => null);
      if (user) {
        const { password, ...safeProfile } = user;
        return {
          id: user.id,
          authId: String(user.id),
          email: user.email,
          phone: user.phone,
          metadata: { name: user.name, role: user.role },
          profile: safeProfile,
        };
      }
    }

    // 2. Fallback: Verifikasi token via Supabase Auth jika token adalah Supabase JWT
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        const profile = await UserModel.findByEmail(user.email).catch(() => null);
        const { password, ...safeProfile } = profile || {};
        return {
          id: profile?.id ?? null,
          authId: user.id,
          email: user.email,
          phone: user.phone,
          metadata: user.user_metadata,
          profile: safeProfile || {
            name: user.user_metadata?.name || user.email?.split('@')[0],
            role: user.user_metadata?.role || 'consumer',
          },
        };
      }
    } catch {
      // Abaikan error Supabase dan lempar AppError di bawah
    }

    throw new AppError('Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.', 401);
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
