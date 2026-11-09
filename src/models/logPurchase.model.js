import { supabase } from '../config/supabase.js';

export const logPurchaseModel = {
  async add(purchaseId, keterangan, action) {
    const { data, error } = await supabase
      .from('log_purchases')
      .insert([
        {
          purchase_id: purchaseId,
          keterangan: keterangan,
          action: action,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async findByPurchaseId(purchaseId) {
    const { data, error } = await supabase
      .from('log_purchases')
      .select('*')
      .eq('purchase_id', purchaseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};

export const add = logPurchaseModel.add;
