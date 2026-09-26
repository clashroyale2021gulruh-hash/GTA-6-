/// <reference types="vite/client" />
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Configuration keys stored safely in localStorage
const SUPABASE_URL_STORAGE_KEY = 'gta6_supabase_url_v1';
const SUPABASE_ANON_KEY_STORAGE_KEY = 'gta6_supabase_anon_key_v1';

// Default project configuration provided by user
const DEFAULT_PROJECT_URL = 'https://yxgairzygowyfvayaygl.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_fockQ9WubKSgG9dFro_VBQ_M4qxBBVr';

// Default from environment variables (if provided at build/deploy time)
const ENV_SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

let supabaseInstance: SupabaseClient | null = null;

/**
 * Normalizes input URL: if given just reference ID (e.g. "yxgairzygowyfvayaygl"),
 * converts it to "https://yxgairzygowyfvayaygl.supabase.co"
 */
export function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return `https://${trimmed}.supabase.co`;
}

/**
 * Get current configured Supabase credentials
 */
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean; source: 'env' | 'custom' | 'default' | 'none' } {
  const customUrl = (typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_URL_STORAGE_KEY) : '') || '';
  const customAnonKey = (typeof window !== 'undefined' ? localStorage.getItem(SUPABASE_ANON_KEY_STORAGE_KEY) : '') || '';

  if (customUrl && customAnonKey) {
    return { url: normalizeSupabaseUrl(customUrl), anonKey: customAnonKey, isConfigured: true, source: 'custom' };
  }

  const envUrl = normalizeSupabaseUrl(ENV_SUPABASE_URL);
  if (envUrl && ENV_SUPABASE_ANON_KEY && !envUrl.includes('your-project')) {
    return { url: envUrl, anonKey: ENV_SUPABASE_ANON_KEY, isConfigured: true, source: 'env' };
  }

  if (DEFAULT_PROJECT_URL && DEFAULT_ANON_KEY) {
    return { url: DEFAULT_PROJECT_URL, anonKey: DEFAULT_ANON_KEY, isConfigured: true, source: 'default' };
  }

  return { url: customUrl || ENV_SUPABASE_URL, anonKey: customAnonKey || ENV_SUPABASE_ANON_KEY, isConfigured: false, source: 'none' };
}

/**
 * Check if Supabase client is configured and ready
 */
export function isSupabaseConfigured(): boolean {
  const creds = getSupabaseCredentials();
  return Boolean(creds.isConfigured && creds.url && creds.anonKey && creds.url.startsWith('http'));
}

/**
 * Retrieve or initialize the Supabase client
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured || !url || !anonKey) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'gta6_supabase_auth_token'
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Configure Supabase credentials dynamically (saves to storage & re-initializes client)
 */
export async function configureSupabase(url: string, anonKey: string): Promise<{ success: boolean; message: string; user?: User | null }> {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = anonKey.trim();

  if (!cleanUrl.startsWith('https://') && !cleanUrl.startsWith('http://')) {
    return { success: false, message: 'URL проекта должен быть в формате https://abcdefghijklm.supabase.co или просто ID проекта' };
  }

  if (cleanKey.length < 20) {
    return { success: false, message: 'Anon Key слишком короткий. Проверьте правильность публичного ключа (anon/public).' };
  }

  try {
    const testClient = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });

    // Test connectivity by querying auth session
    const { data: sessionData, error: sessionErr } = await testClient.auth.getSession();
    if (sessionErr) {
      return { success: false, message: `Ошибка проверки ключей: ${sessionErr.message}` };
    }

    // Save to storage
    localStorage.setItem(SUPABASE_URL_STORAGE_KEY, cleanUrl);
    localStorage.setItem(SUPABASE_ANON_KEY_STORAGE_KEY, cleanKey);
    supabaseInstance = testClient;

    return {
      success: true,
      message: 'Подключение к Supabase успешно установлено!',
      user: sessionData.session?.user || null
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Не удалось подключиться к указанному проекту Supabase'
    };
  }
}

/**
 * Disconnect Supabase and clear custom credentials
 */
export async function disconnectSupabase(): Promise<void> {
  if (supabaseInstance) {
    try {
      await supabaseInstance.auth.signOut();
    } catch {
      // ignore
    }
  }
  supabaseInstance = null;
  localStorage.removeItem(SUPABASE_URL_STORAGE_KEY);
  localStorage.removeItem(SUPABASE_ANON_KEY_STORAGE_KEY);
  localStorage.removeItem('gta6_supabase_auth_token');
}

/**
 * Register a user in Supabase
 */
export async function supabaseSignUp(email: string, password: string, displayName?: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase не настроен. Пожалуйста, укажите URL проекта и Anon Key.');
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
        avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'
      }
    }
  });

  if (error) {
    throw error;
  }

  // Create or sync user profile record in public.profiles table if available
  if (data.user) {
    try {
      await client.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        display_name: displayName || data.user.email?.split('@')[0],
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch {
      // ignore if profiles table is not created yet
    }
  }

  return data;
}

/**
 * Sign in a user with Supabase
 */
export async function supabaseSignIn(email: string, password: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase не настроен. Пожалуйста, укажите URL проекта и Anon Key.');
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out current user
 */
export async function supabaseSignOut() {
  const client = getSupabase();
  if (client) {
    await client.auth.signOut();
  }
}

/**
 * Get current session
 */
export async function supabaseGetSession(): Promise<Session | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

/**
 * Sync favorites to Supabase user metadata / cloud
 */
export async function supabaseSyncUserData(userId: string, data: { favCheats?: string[]; favNews?: string[]; isVip?: boolean }) {
  const client = getSupabase();
  if (!client || !userId) return;

  try {
    await client.from('user_data').upsert({
      user_id: userId,
      favorite_cheats: data.favCheats,
      favorite_news: data.favNews,
      is_vip: data.isVip,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  } catch {
    // If table doesn't exist, update user metadata
    try {
      await client.auth.updateUser({
        data: {
          favorite_cheats: data.favCheats,
          favorite_news: data.favNews,
          is_vip: data.isVip
        }
      });
    } catch {
      // ignore
    }
  }
}
