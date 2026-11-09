import { supabase } from '../config/supabase.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const ROLES = new Set(['consumer', 'supplier']);
const PRIORITIES = new Set(['Rendah', 'Sedang', 'Tinggi']);
const STATUSES = new Set(['Menunggu', 'Sedang Ditangani', 'Terselesaikan']);

function requireServiceRoleKey() {
  if (!config.supabase.serviceRoleKey) {
    throw new AppError('SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi untuk mengelola pengaduan.', 503);
  }
}

function validateRecord(data, { update = false } = {}) {
  const required = update
    ? ['status']
    : ['reporterRole', 'reporterName', 'reporterPhone', 'title', 'category', 'description'];

  for (const field of required) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new AppError(`Kolom ${field} wajib diisi.`, 400);
    }
  }

  if (!update && !ROLES.has(data.reporterRole)) {
    throw new AppError('Pelapor harus konsumen atau supplier.', 400);
  }
  if (data.priority !== undefined && !PRIORITIES.has(data.priority)) {
    throw new AppError('Prioritas pengaduan tidak valid.', 400);
  }
  if (data.status !== undefined && !STATUSES.has(data.status)) {
    throw new AppError('Status pengaduan tidak valid.', 400);
  }
  if (data.status === 'Terselesaikan' && !String(data.resolution || '').trim()) {
    throw new AppError('Catatan penyelesaian wajib diisi sebelum pengaduan ditutup.', 400);
  }
  if (data.status && data.status !== 'Terselesaikan' && data.resolution !== undefined && data.resolution !== null && String(data.resolution).trim()) {
    throw new AppError('Catatan penyelesaian hanya dapat diisi saat pengaduan selesai.', 400);
  }
}

function toResponse(row) {
  return {
    id: row.id,
    reporterRole: row.reporter_role,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone,
    title: row.title,
    category: row.category,
    priority: row.priority,
    orderNumber: row.order_number,
    description: row.description,
    status: row.status,
    adminNotes: row.admin_notes,
    resolution: row.resolution,
    receivedAt: row.received_at,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const complaintService = {
  async getAll() {
    requireServiceRoleKey();
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('received_at', { ascending: false });

    if (error) throw new AppError(`Gagal mengambil pengaduan: ${error.message}`, 500);
    return data.map(toResponse);
  },

  async create(data, adminId) {
    requireServiceRoleKey();
    validateRecord(data);
    const { data: row, error } = await supabase
      .from('complaints')
      .insert({
        reporter_role: data.reporterRole,
        reporter_name: data.reporterName.trim(),
        reporter_phone: data.reporterPhone.trim(),
        title: data.title.trim(),
        category: data.category.trim(),
        priority: data.priority || 'Sedang',
        order_number: String(data.orderNumber || '').trim() || null,
        description: data.description.trim(),
        status: 'Menunggu',
        admin_notes: '',
        resolution: null,
        created_by: adminId || null,
        updated_by: adminId || null,
      })
      .select('*')
      .single();

    if (error) throw new AppError(`Gagal mencatat pengaduan: ${error.message}`, 500);
    return toResponse(row);
  },

  async update(id, data, adminId) {
    requireServiceRoleKey();
    if (!/^\d+$/.test(String(id))) throw new AppError('ID pengaduan tidak valid.', 400);
    validateRecord(data, { update: true });

    const { data: row, error } = await supabase
      .from('complaints')
      .update({
        status: data.status,
        admin_notes: String(data.adminNotes || '').trim(),
        resolution: data.status === 'Terselesaikan' ? String(data.resolution).trim() : null,
        updated_by: adminId || null,
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new AppError(`Gagal memperbarui pengaduan: ${error.message}`, 500);
    if (!row) throw new AppError('Pengaduan tidak ditemukan.', 404);
    return toResponse(row);
  },

  async remove(id) {
    requireServiceRoleKey();
    if (!/^\d+$/.test(String(id))) throw new AppError('ID pengaduan tidak valid.', 400);
    const { data, error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) throw new AppError(`Gagal menghapus pengaduan: ${error.message}`, 500);
    if (!data) throw new AppError('Pengaduan tidak ditemukan.', 404);
    return true;
  },
};
