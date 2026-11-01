import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

if (!config.supabase.url || (!config.supabase.serviceRoleKey && !config.supabase.anonKey)) {
  console.warn('⚠️ Warning: Supabase credentials are missing. Check your .env file.');
}

// Dummy transport for environments (like Node < 22) without native global WebSocket
const realtimeConfig = typeof WebSocket !== 'undefined'
  ? {}
  : { transport: class DummyWebSocket {} };

/**
 * Supabase client for backend operations.
 * Menggunakan serviceRoleKey agar backend memiliki akses penuh (bypass RLS untuk server-side tasks)
 * atau anonKey jika serviceRoleKey belum dikonfigurasi.
 */
export const supabase = createClient(
  config.supabase.url || 'https://placeholder.supabase.co',
  config.supabase.serviceRoleKey || config.supabase.anonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: realtimeConfig,
  }
);

