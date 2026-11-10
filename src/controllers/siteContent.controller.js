import { siteContentService } from '../services/siteContent.service.js';
import { successResponse } from '../utils/response.js';
import { AppError } from '../utils/errors.js';

export const getPublicContent = async (req, res, next) => {
  try {
    const content = await siteContentService.getPublic(req.params.type, req.params.audience);
    return successResponse(res, 200, 'Konten berhasil diambil.', content);
  } catch (error) {
    next(error);
  }
};

export const getAdminContent = async (req, res, next) => {
  try {
    if (req.user?.profile?.role !== 'admin') {
      throw new AppError('Akses hanya untuk admin.', 403);
    }
    const content = await siteContentService.getAll();
    return successResponse(res, 200, 'Konten berhasil diambil.', content);
  } catch (error) {
    next(error);
  }
};

export const saveAdminContent = async (req, res, next) => {
  try {
    if (req.user?.profile?.role !== 'admin') {
      throw new AppError('Akses hanya untuk admin.', 403);
    }
    const content = await siteContentService.save(
      req.params.type,
      req.params.audience,
      req.body?.content,
      req.user.id
    );
    return successResponse(res, 200, 'Konten berhasil disimpan.', content);
  } catch (error) {
    next(error);
  }
};
