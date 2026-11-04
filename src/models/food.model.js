import { supabase } from '../config/supabase.js';

// Sertakan data supplier (tabel users) supaya katalog menampilkan nama toko & alamat dari supplier.
const WITH_SUPPLIER = '*, supplier:users!supplier_id(id, name, outlet, address, phone, avatar)';

export const FoodModel = {
  /**
   * Mengambil semua data barang / makanan dengan opsi query
   */
  async findAll({ search, category, supplier_id, sortBy = 'created_at', order = 'desc', limit, page = 1 } = {}) {
    let query = supabase.from('products').select(WITH_SUPPLIER, { count: 'exact' });

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const isAscending = order.toLowerCase() === 'asc';
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
   * Mengambil satu data barang berdasarkan ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(WITH_SUPPLIER)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Menambahkan barang baru ke database
   */
  async create(foodData) {
    const { data, error } = await supabase
      .from('products')
      .insert([foodData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengupdate data barang berdasarkan ID
   */
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Menghapus data barang berdasarkan ID
   */
  async delete(id) {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};

