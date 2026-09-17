import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function getEnvVar(key: string): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return '';
}

export const getSupabaseUrl = () =>
  getEnvVar('PUBLIC_SUPABASE_URL') || 'https://kzzpbxgsffmeyvckdmhs.supabase.co';

export const getSupabaseAnonKey = () =>
  getEnvVar('PUBLIC_SUPABASE_ANON_KEY') || 'sb_publishable_RiY4hw4wLM7gJvz5a_4xZQ_Ormrf3KM';

export const getSupabaseServiceKey = () =>
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY') ||
  getEnvVar('SUPABASE_SERVICE_KEY') ||
  '';

// Client for public usage (respects RLS)
export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);

let _cachedAdminClient: SupabaseClient | null = null;
let _cachedKeyUsed = '';

export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey() || getSupabaseAnonKey();

  if (!_cachedAdminClient || _cachedKeyUsed !== serviceKey) {
    _cachedAdminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    _cachedKeyUsed = serviceKey;
  }
  return _cachedAdminClient;
}

// Administrative client for SSR admin pages and server endpoints (bypasses RLS when service key is set)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

