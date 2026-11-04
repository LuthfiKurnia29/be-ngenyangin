import multer from 'multer';
import { AppError } from '../utils/errors.js';

// Upload gambar: memory storage, maks 2 MB, hanya JPG/PNG/WebP
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true)
      : cb(new AppError('Format gambar harus JPG, PNG, atau WebP.', 400)),
});
