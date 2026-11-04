import { supabase } from '../config/supabase.js';
export const addDetail = async (purchaseId, productId, jumlah, priceQty, total_price) => {
    const { data, error } = await supabase.from('detail_purchases').insert([
        {
            purchaseId: purchaseId,
            productId: productId,
            jumlah: jumlah,
            priceQty: priceQty,
            total_price: total_price,
            created_at: new Date().getDate()
        }
    ]).select();

    if (error) throw error;
    return data[0];
}