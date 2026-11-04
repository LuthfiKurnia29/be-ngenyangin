import { supabase } from '../config/supabase.js';

export const CategoryModel = {
  /**
   * Mengambil semua data kategori dengan opsi pencarian, sorting, dan paginasi
   */
  async findAll({ search, sortBy = 'id', order = 'asc', limit, page = 1 } = {}) {
    let query = supabase.from('categories').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const isAscending = String(order).toLowerCase() === 'asc';
    query = query.order(sortBy, { ascending: isAscending });

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10) || 1;
      const from = (parsedPage - 1) * parsedLimit;
      const to = from + parsedLimit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return { data, count };
  },

  /**
   * Mengambil kategori berdasarkan ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Mengambil kategori berdasarkan nama (case-insensitive)
   */
  async findByName(name) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', name)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Membuat kategori baru
   */
  async create(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengupdate data kategori berdasarkan ID
   */
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Menghapus kategori berdasarkan ID
   */
  async delete(id) {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

