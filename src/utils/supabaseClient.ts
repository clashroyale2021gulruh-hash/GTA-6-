import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase (configured via .env or VITE_*)
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const DEFAULT_PROJECT_REF = 'yxgairzygowyfvayaygl';
const DEFAULT_ANON_KEY = 'sb_publishable_fockQ9WubKSgG9dFro_VBQ_M4qxBBVr';

/**
 * Normalizes any Supabase URL or project reference to a valid https://... URL.
 * Handles inputs like "yxgairzygowyfvayaygl", "yxgairzygowyfvayaygl.supabase.co", or full "https://..."
 */
function normalizeSupabaseUrl(rawUrl?: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    return `https://${DEFAULT_PROJECT_REF}.supabase.co`;
  }

  // If the user provided only the project reference identifier (e.g., 'yxgairzygowyfvayaygl')
  if (/^[a-z0-9_-]+$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }

  // If URL lacks http/https protocol
  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(withProtocol)) {
    withProtocol = `https://${withProtocol}`;
  }

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return `https://${DEFAULT_PROJECT_REF}.supabase.co`;
  }
}

function normalizeSupabaseKey(rawKey?: string): string {
  const trimmed = (rawKey || '').trim();
  if (trimmed && trimmed.length > 10 && trimmed !== 'undefined') {
    return trimmed;
  }
  return DEFAULT_ANON_KEY;
}

const finalSupabaseUrl = normalizeSupabaseUrl(metaEnv.VITE_SUPABASE_URL);
const finalSupabaseKey = normalizeSupabaseKey(metaEnv.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(
  (metaEnv.VITE_SUPABASE_URL || DEFAULT_PROJECT_REF) &&
  (metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY)
);

function createSafeSupabaseClient(): SupabaseClient {
  try {
    return createClient(finalSupabaseUrl, finalSupabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase with custom config, falling back:', err);
    return createClient(`https://${DEFAULT_PROJECT_REF}.supabase.co`, DEFAULT_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }
}

export const supabase: SupabaseClient = createSafeSupabaseClient();

export interface SupabaseVipResult {
  isVip: boolean;
  vipActive: boolean;
  vipExpiresAt?: string | null;
  rawData?: any;
  source: 'supabase_profiles' | 'supabase_users' | 'cache' | 'offline_timeout' | 'error';
  errorMessage?: string;
}

/**
 * Checks VIP status and subscription validity directly in Supabase (profiles or users table)
 * Includes strict timeout handling so offline mobile devices or slow networks never freeze.
 */
export async function checkSupabaseVipStatus(
  deviceId: string,
  timeoutMs = 4000
): Promise<SupabaseVipResult> {
  if (!deviceId) {
    return {
      isVip: false,
      vipActive: false,
      source: 'error',
      errorMessage: 'Device ID is required'
    };
  }

  // Graceful offline timeout
  const timeoutPromise = new Promise<SupabaseVipResult>((resolve) => {
    setTimeout(() => {
      resolve({
        isVip: false,
        vipActive: false,
        source: 'offline_timeout',
        errorMessage: 'Таймаут соединения с Supabase (активен оффлайн-режим)'
      });
    }, timeoutMs);
  });

  const fetchPromise = (async (): Promise<SupabaseVipResult> => {
    try {
      // 0. Check Supabase Auth user metadata first (works even without custom database tables)
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const meta = authData.user.user_metadata || {};
          if (meta.vip_active === true || meta.is_vip === true) {
            return {
              isVip: true,
              vipActive: true,
              vipExpiresAt: meta.vip_expires_at || null,
              rawData: meta,
              source: 'supabase_users'
            };
          }
        }
      } catch {
        // non-blocking
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceId);

      // 1. Query 'profiles' table safely
      try {
        const query = supabase.from('profiles').select('*');
        const filterQuery = isUuid
          ? query.or(`device_id.eq.${deviceId},id.eq.${deviceId}`)
          : query.eq('device_id', deviceId);

        const { data: profileData, error: profileErr } = await filterQuery.limit(1).maybeSingle();

        if (!profileErr && profileData) {
          const isVip = Boolean(
            profileData.vip_active === true ||
            profileData.is_vip === true ||
            profileData.vip === true ||
            (profileData.vip_expires_at && new Date(profileData.vip_expires_at).getTime() > Date.now())
          );

          if (isVip) {
            return {
              isVip: true,
              vipActive: true,
              vipExpiresAt: profileData.vip_expires_at || null,
              rawData: profileData,
              source: 'supabase_profiles'
            };
          }
        }
      } catch {
        // ignore schema errors
      }

      // 2. Query 'users' table as alternative schema
      try {
        const queryUsers = supabase.from('users').select('*');
        const filterUsers = isUuid
          ? queryUsers.or(`device_id.eq.${deviceId},id.eq.${deviceId}`)
          : queryUsers.eq('device_id', deviceId);

        const { data: userData, error: userErr } = await filterUsers.limit(1).maybeSingle();

        if (!userErr && userData) {
          const isVip = Boolean(
            userData.vip_active === true ||
            userData.is_vip === true ||
            userData.vip === true ||
            (userData.vip_expires_at && new Date(userData.vip_expires_at).getTime() > Date.now())
          );

          if (isVip) {
            return {
              isVip: true,
              vipActive: true,
              vipExpiresAt: userData.vip_expires_at || null,
              rawData: userData,
              source: 'supabase_users'
            };
          }
        }
      } catch {
        // ignore
      }

      // 3. Fallback: check backend server VIP verification cache
      try {
        const srvRes = await fetch(`/api/vip/status?id=${encodeURIComponent(deviceId)}`).then((r) => r.json());
        if (srvRes?.ok && srvRes?.isVip) {
          return {
            isVip: true,
            vipActive: true,
            source: 'supabase_profiles',
            rawData: srvRes
          };
        }
      } catch {
        // ignore
      }

      return {
        isVip: false,
        vipActive: false,
        source: 'supabase_profiles',
        errorMessage: 'Активная VIP-лицензия не найдена'
      };
    } catch (err: any) {
      return {
        isVip: false,
        vipActive: false,
        source: 'error',
        errorMessage: err?.message || 'Ошибка запроса к Supabase'
      };
    }
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Syncs the local device profile with Supabase if online (non-blocking with timeout)
 */
export async function syncDeviceToSupabase(
  deviceId: string,
  profile: { displayName?: string; avatarUrl?: string; isVip?: boolean }
): Promise<void> {
  if (!deviceId) return;
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000)
    );
    const opPromise = supabase.from('profiles').upsert(
      {
        device_id: deviceId,
        display_name: profile.displayName || 'Игрок Leonida',
        avatar_url: profile.avatarUrl,
        vip_active: Boolean(profile.isVip),
        is_vip: Boolean(profile.isVip),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'device_id' }
    );

    await Promise.race([opPromise, timeoutPromise]);
  } catch {
    // Non-blocking fallback
  }
}
