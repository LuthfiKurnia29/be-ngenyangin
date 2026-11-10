import { supabase } from '../config/supabase.js';

// Sertakan data supplier dan kategori (tabel users dan categories)
const WITH_SUPPLIER = '*, supplier:users!supplier_id(id, name, outlet, address, phone, avatar)';
const WITH_RELATIONS = '*, supplier:users!supplier_id(id, name, outlet, address, phone, avatar), category_detail:categories!category_id(id, name, description, image_url)';

const formatFood = (food) => {
  if (!food) return food;
  return {
    ...food,
    category_id: food.category_id ?? food.category_detail?.id ?? null,
    category_detail: food.category_detail || null,
  };
};

export const FoodModel = {
  /**
   * Mengambil semua data barang / makanan dengan opsi query
   */
  async findAll({ search, category, category_id, categoryId, supplier_id, availableOnly, sortBy = 'created_at', order = 'desc', limit, page = 1 } = {}) {
    const buildQuery = (selectStr) => {
      let query = supabase.from('products').select(selectStr, { count: 'exact' });

      if (String(availableOnly).toLowerCase() === 'true') {
        query = query.eq('is_active', true).gt('stock', 0);
      }

      const catId = category_id || categoryId;
      if (catId) {
        query = query.eq('category_id', catId);
      } else if (category) {
        // Mendukung filter id kategori numerik atau nama kategori
        if (!isNaN(category) && Number(category) > 0) {
          query = query.eq('category_id', Number(category));
        } else {
          query = query.ilike('category', `%${category}%`);
        }
      }

      if (supplier_id) {
        query = query.eq('supplier_id', supplier_id);
      }

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

      return query;
    };

    let { data, error, count } = await buildQuery(WITH_RELATIONS);

    // Fallback jika relasi category_id belum tersedia di Supabase sebelum migrasi dijalankan
    if (error && (error.message?.includes('categories') || error.code === 'PGRST200')) {
      const fallback = await buildQuery(WITH_SUPPLIER);
      if (fallback.error) throw fallback.error;
      data = fallback.data;
      count = fallback.count;
    } else if (error) {
      throw error;
    }

    return {
      data: Array.isArray(data) ? data.map(formatFood) : data,
      count,
    };
  },

  /**
   * Mengambil satu data barang berdasarkan ID
   */
  async findById(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return null;
    }

    let { data, error } = await supabase
      .from('products')
      .select(WITH_RELATIONS)
      .eq('id', parsedId)
      .maybeSingle();

    if (error && (error.message?.includes('categories') || error.code === 'PGRST200')) {
      const fallback = await supabase
        .from('products')
        .select(WITH_SUPPLIER)
        .eq('id', id)
        .maybeSingle();
      if (fallback.error) throw fallback.error;
      data = fallback.data;
    } else if (error) {
      throw error;
    }

    return formatFood(data);
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
    return formatFood(data);
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
    return formatFood(data);
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
