import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  midtrans: {
    serverKey: (process.env.MIDTRANS_SERVER_KEY || '').trim(),
    clientKey: (process.env.MIDTRANS_CLIENT_KEY || '').trim(),
    isProduction: (process.env.MIDTRANS_IS_PRODUCTION || '').trim().toLowerCase() === 'true',
  },
};
