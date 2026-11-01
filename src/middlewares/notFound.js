import { errorResponse } from '../utils/response.js';

export const notFound = (req, res, next) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} not found`);
};

