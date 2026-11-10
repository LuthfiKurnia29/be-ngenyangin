import { complaintService } from '../services/complaint.service.js';
import { AppError } from '../utils/errors.js';
import { successResponse } from '../utils/response.js';

function assertAdmin(req) {
  if (req.user?.profile?.role !== 'admin') {
    throw new AppError('Akses hanya untuk admin.', 403);
  }
}

export const getComplaints = async (req, res, next) => {
  try {
    assertAdmin(req);
    return successResponse(res, 200, 'Pengaduan berhasil diambil.', await complaintService.getAll());
  } catch (error) {
    next(error);
  }
};

export const createComplaint = async (req, res, next) => {
  try {
    assertAdmin(req);
    const complaint = await complaintService.create(req.body, req.user.id);
    return successResponse(res, 201, 'Pengaduan berhasil dicatat.', complaint);
  } catch (error) {
    next(error);
  }
};

export const updateComplaint = async (req, res, next) => {
  try {
    assertAdmin(req);
    const complaint = await complaintService.update(req.params.id, req.body, req.user.id);
    return successResponse(res, 200, 'Pengaduan berhasil diperbarui.', complaint);
  } catch (error) {
    next(error);
  }
};

export const deleteComplaint = async (req, res, next) => {
  try {
    assertAdmin(req);
    await complaintService.remove(req.params.id);
    return successResponse(res, 200, 'Pengaduan berhasil dihapus.');
  } catch (error) {
    next(error);
  }
};
