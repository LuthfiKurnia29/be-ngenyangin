import { supabase } from '../config/supabase.js';

export const PurchaseModel = {
  /**
   * Mengambil semua data purchase dengan opsi query
   */
  async findAll({ consumer_id, supplier_id, status, sortBy = 'created_at', order = 'desc', limit, page = 1 } = {}) {
    let query = supabase
      .from('purchases')
      .select('*, detail_purchases(*), consumer:users!consumer_id(id, name, email, phone), supplier:users!supplier_id(id, name, outlet, phone)', { count: 'exact' });

    if (consumer_id !== undefined && consumer_id !== null) {
      const cid = parseInt(consumer_id, 10);
      if (!isNaN(cid) && cid > 0) {
        query = query.eq('consumer_id', cid);
      }
    }
    if (supplier_id !== undefined && supplier_id !== null) {
      const sid = parseInt(supplier_id, 10);
      if (!isNaN(sid) && sid > 0) {
        query = query.eq('supplier_id', sid);
      }
    }
    if (status) {
      query = query.eq('status', status);
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
   * Mengambil satu data purchase berdasarkan ID
   */
  async findById(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return null;
    }

    const { data, error } = await supabase
      .from('purchases')
      .select('*, detail_purchases(*), log_purchases(*), consumer:users!consumer_id(id, name, email, phone), supplier:users!supplier_id(id, name, outlet, phone)')
      .eq('id', parsedId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Mengambil data purchase berdasarkan order_number (untuk Midtrans callback)
   */
  async findByOrderNumber(orderNumber) {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, detail_purchases(*), log_purchases(*), consumer:users!consumer_id(id, name, email, phone)')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Menambahkan order baru ke database
   */
  async create(purchaseData) {
    const { data, error } = await supabase
      .from('purchases')
      .insert([purchaseData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengupdate data purchase berdasarkan ID
   */
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('purchases')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengupdate data purchase berdasarkan order_number
   */
  async updateByOrderNumber(orderNumber, updateData) {
    const { data, error } = await supabase
      .from('purchases')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('order_number', orderNumber)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Menghapus purchase berdasarkan ID
   */
  async delete(id) {
    const { data, error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
