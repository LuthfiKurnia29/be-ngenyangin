import { supabase } from '../config/supabase.js';

export const PasswordResetModel = {
  /**
   * Simpan atau update token reset password
   */
  async upsert(email, token) {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .upsert(
        {
          email,
          token,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Cari token berdasarkan email
   */
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Cari token berdasarkan token string
   */
  async findByToken(token) {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Hapus token setelah digunakan
   */
  async deleteByEmail(email) {
    const { error } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email);

    if (error) throw error;
    return true;
  },
};

