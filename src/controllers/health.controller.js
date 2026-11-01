import { successResponse } from '../utils/response.js';

export const checkHealth = (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
  };

  return successResponse(res, 200, 'Server is healthy', healthData);
};

