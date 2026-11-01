import { supabase } from '../config/supabase.js';

export const UserModel = {
  /**
   * Cari user berdasarkan ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Cari user berdasarkan Email
   */
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Upsert data user ke tabel users
   */
  async upsert(userData) {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Update data user berdasarkan ID
   */
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

