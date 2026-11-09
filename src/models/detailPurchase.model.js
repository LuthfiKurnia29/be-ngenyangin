import { supabase } from '../config/supabase.js';

export const detailPurchaseModel = {
  async createMany(items) {
    const { data, error } = await supabase
      .from('detail_purchases')
      .insert(items)
      .select();

    if (error) throw error;
    return data;
  },

  async findByPurchaseId(purchaseId) {
    const { data, error } = await supabase
      .from('detail_purchases')
      .select('*, products(*)')
      .eq('purchase_id', purchaseId);

    if (error) throw error;
    return data || [];
  },
};

export const addDetail = async (detailData) => {
  if (Array.isArray(detailData)) {
    return detailPurchaseModel.createMany(detailData);
  }
  return detailPurchaseModel.createMany([detailData]);
};
