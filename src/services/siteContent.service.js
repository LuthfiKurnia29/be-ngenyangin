import { supabase } from '../config/supabase.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const CONTENT_TYPES = new Set(['faq', 'food_policy', 'contact', 'terms']);
const AUDIENCES = new Set(['consumer', 'supplier', 'all']);

function validateTarget(type, audience) {
  if (!CONTENT_TYPES.has(type)) {
    throw new AppError('Jenis konten tidak valid.', 400);
  }
  if (!AUDIENCES.has(audience) || (type === 'contact' ? audience !== 'all' : audience === 'all')) {
    throw new AppError('Target audiens tidak valid untuk jenis konten ini.', 400);
  }
}

function requireServiceRoleKey() {
  if (!config.supabase.serviceRoleKey) {
    throw new AppError('SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi untuk mengelola konten situs.', 503);
  }
}

function validatePayload(type, payload) {
  if (type === 'contact') {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new AppError('Format informasi kontak tidak valid.', 400);
    }
    for (const field of ['email', 'phone', 'hours', 'message']) {
      if (typeof payload[field] !== 'string' || !payload[field].trim()) {
        throw new AppError(`Informasi ${field} wajib diisi.`, 400);
      }
    }
    return;
  }

  if (!Array.isArray(payload)) {
    throw new AppError('Konten harus berupa daftar.', 400);
  }

  const requiredFields = type === 'faq'
    ? ['question', 'answer']
    : type === 'food_policy'
      ? ['title', 'content', 'reference']
      : ['title', 'content'];

  if (type === 'terms' && payload.length === 0) {
    throw new AppError('Syarat dan ketentuan harus memiliki minimal satu bagian.', 400);
  }

  for (const [index, item] of payload.entries()) {
    if (!item || typeof item !== 'object' || requiredFields.some(
      (field) => typeof item[field] !== 'string' || !item[field].trim()
    )) {
      throw new AppError(`Konten nomor ${index + 1} belum lengkap.`, 400);
    }
  }
}

function toResponse(row) {
  return {
    type: row.content_type,
    audience: row.audience,
    content: row.payload,
    version: row.version,
    updated_at: row.updated_at,
  };
}

export const siteContentService = {
  async getPublic(type, audience) {
    requireServiceRoleKey();
    validateTarget(type, audience);
    const { data, error } = await supabase
      .from('site_contents')
      .select('content_type,audience,payload,version,updated_at')
      .eq('content_type', type)
      .eq('audience', audience)
      .eq('is_published', true)
      .maybeSingle();

    if (error) throw new AppError(`Gagal mengambil konten: ${error.message}`, 500);
    if (!data) throw new AppError('Konten belum tersedia.', 404);
    return toResponse(data);
  },

  async getAll() {
    requireServiceRoleKey();
    const { data, error } = await supabase
      .from('site_contents')
      .select('content_type,audience,payload,version,is_published,updated_at,updated_by')
      .order('content_type')
      .order('audience');

    if (error) throw new AppError(`Gagal mengambil konten: ${error.message}`, 500);
    return data.map(toResponse);
  },

  async save(type, audience, payload, userId) {
    requireServiceRoleKey();
    validateTarget(type, audience);
    validatePayload(type, payload);
    if (JSON.stringify(payload).length > 100_000) {
      throw new AppError('Ukuran konten melebihi batas 100 KB.', 413);
    }

    const { data, error } = await supabase
      .from('site_contents')
      .upsert({
        content_type: type,
        audience,
        payload,
        is_published: true,
        updated_by: userId || null,
      }, { onConflict: 'content_type,audience' })
      .select('content_type,audience,payload,version,updated_at')
      .single();

    if (error) throw new AppError(`Gagal menyimpan konten: ${error.message}`, 500);
    return toResponse(data);
  },
};
