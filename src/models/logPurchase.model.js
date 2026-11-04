import { supabase } from '../config/supabase.js';
export const add = async (purchaseId, keterangan, action) => {
    const { data, error } = await supabase.from('log_purchases').insert([
        {
            purchaseId: purchaseId,
            keterangan: keterangan, 
            action: action,
            created_at: new Date().getDate()
        }
    ]).select();

    if (error) throw error;
    return data[0];
}