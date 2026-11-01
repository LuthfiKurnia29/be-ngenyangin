import { errorResponse } from '../utils/response.js';
import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const errors = config.env === 'development' ? { stack: err.stack } : null;

  return errorResponse(res, statusCode, message, errors);
};

