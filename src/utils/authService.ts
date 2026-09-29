import { supabase } from './supabaseClient';

export interface UserCloudProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isVip: boolean;
  vipInvoiceId?: number;
  vipVerifiedAt?: string;
  vipAmount?: string;
  vipAsset?: string;
  savedCheats?: string[];
  savedNews?: string[];
  isAnonymous?: boolean;
}

export interface AuthUser {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous?: boolean;
}

export type User = AuthUser;
export type FirebaseUser = AuthUser;

function mapSupabaseUser(user: any): AuthUser {
  return {
    id: user.id,
    uid: user.id,
    email: user.email || null,
    displayName:
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Игрок Leonida',
    isAnonymous: Boolean(user.is_anonymous || user.app_metadata?.provider === 'anonymous')
  };
}

/**
 * Signs in user with email and password via Supabase Auth
 */
export async function loginWithEmail(email: string, pass: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: pass
  });

  if (error) {
    throw new Error(error.message || 'Ошибка входа');
  }

  if (!data.user) {
    throw new Error('Пользователь не найден');
  }

  return mapSupabaseUser(data.user);
}

/**
 * Registers new user with email, password, and optional nickname via Supabase Auth
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  name?: string
): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: pass,
    options: {
      data: {
        display_name: name?.trim() || 'Игрок Leonida'
      }
    }
  });

  if (error) {
    throw new Error(error.message || 'Ошибка регистрации');
  }

  if (!data.user) {
    throw new Error('Не удалось создать аккаунт');
  }

  const authUser = mapSupabaseUser(data.user);

  // Initialize row in Supabase 'profiles' table
  try {
    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        email: data.user.email,
        display_name: name?.trim() || 'Игрок Leonida',
        is_vip: false,
        vip_active: false,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Initial Supabase profile write warning:', err);
  }

  return authUser;
}

/**
 * Quick sign-in as Guest (Anonymous)
 */
export async function loginAsGuest(): Promise<AuthUser> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data?.user) {
      return mapSupabaseUser(data.user);
    }
  } catch {
    // fallback if anonymous auth not enabled in supabase project
  }

  // Graceful local guest user
  const guestUid = 'guest_' + Math.random().toString(36).substring(2, 10);
  return {
    id: guestUid,
    uid: guestUid,
    email: null,
    displayName: 'Гость Leonida',
    isAnonymous: true
  };
}

/**
 * Signs out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut error:', err);
  }
}

/**
 * Reads cloud user profile from Supabase Auth metadata and 'profiles' table
 */
export async function getUserCloudData(uid: string): Promise<UserCloudProfile | null> {
  // 1. Check currently active Supabase Auth user metadata
  try {
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData?.user;
    if (authUser && (authUser.id === uid || !uid)) {
      const meta = authUser.user_metadata || {};
      const isVip = Boolean(meta.vip_active || meta.is_vip);
      if (isVip || meta.display_name || meta.saved_cheats) {
        return {
          uid: authUser.id,
          email: authUser.email || null,
          displayName: meta.display_name || authUser.email?.split('@')[0] || 'Игрок Leonida',
          isVip,
          vipInvoiceId: meta.vip_invoice_id,
          vipVerifiedAt: meta.vip_verified_at,
          vipAmount: meta.vip_amount || '2.99',
          vipAsset: meta.vip_asset || 'USDT',
          savedCheats: Array.isArray(meta.saved_cheats) ? meta.saved_cheats : [],
          savedNews: Array.isArray(meta.saved_news) ? meta.saved_news : []
        };
      }
    }
  } catch {
    // non-blocking
  }

  // 2. Query 'profiles' table safely
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);
    const query = supabase.from('profiles').select('*');
    const filterQuery = isUuid
      ? query.or(`id.eq.${uid},device_id.eq.${uid}`)
      : query.eq('device_id', uid);

    const { data, error } = await filterQuery.limit(1).maybeSingle();

    if (!error && data) {
      return {
        uid: data.id || uid,
        email: data.email || null,
        displayName: data.display_name || 'Игрок Leonida',
        isVip: Boolean(data.vip_active ?? data.is_vip),
        vipInvoiceId: data.vip_invoice_id,
        vipVerifiedAt: data.vip_verified_at,
        vipAmount: data.vip_amount,
        vipAsset: data.vip_asset,
        savedCheats: Array.isArray(data.saved_cheats) ? data.saved_cheats : [],
        savedNews: Array.isArray(data.saved_news) ? data.saved_news : []
      };
    }
  } catch (err) {
    console.warn('Could not read user cloud profile from Supabase:', err);
  }
  return null;
}

/**
 * Updates cloud user profile in Supabase Auth user_metadata and 'profiles' table
 */
export async function saveUserCloudData(
  uid: string,
  data: Partial<UserCloudProfile>
): Promise<void> {
  // 1. Persist directly into Supabase Auth user_metadata
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user && (authData.user.id === uid || !uid)) {
      const currentMeta = authData.user.user_metadata || {};
      const updatedMeta: any = { ...currentMeta };

      if (data.displayName !== undefined) updatedMeta.display_name = data.displayName;
      if (data.isVip !== undefined) {
        updatedMeta.is_vip = data.isVip;
        updatedMeta.vip_active = data.isVip;
      }
      if (data.vipInvoiceId !== undefined) updatedMeta.vip_invoice_id = data.vipInvoiceId;
      if (data.vipVerifiedAt !== undefined) updatedMeta.vip_verified_at = data.vipVerifiedAt;
      if (data.vipAmount !== undefined) updatedMeta.vip_amount = data.vipAmount;
      if (data.vipAsset !== undefined) updatedMeta.vip_asset = data.vipAsset;
      if (data.savedCheats !== undefined) updatedMeta.saved_cheats = data.savedCheats;
      if (data.savedNews !== undefined) updatedMeta.saved_news = data.savedNews;

      await supabase.auth.updateUser({ data: updatedMeta });
    }
  } catch (err) {
    console.warn('Supabase auth metadata update notice:', err);
  }

  // 2. Also try writing to 'profiles' table
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);
    const payload: any = {
      updated_at: new Date().toISOString()
    };

    if (isUuid) {
      payload.id = uid;
    } else {
      payload.device_id = uid;
    }

    if (data.email !== undefined) payload.email = data.email;
    if (data.displayName !== undefined) payload.display_name = data.displayName;
    if (data.isVip !== undefined) {
      payload.is_vip = data.isVip;
      payload.vip_active = data.isVip;
    }
    if (data.vipInvoiceId !== undefined) payload.vip_invoice_id = data.vipInvoiceId;
    if (data.vipVerifiedAt !== undefined) payload.vip_verified_at = data.vipVerifiedAt;
    if (data.vipAmount !== undefined) payload.vip_amount = data.vipAmount;
    if (data.vipAsset !== undefined) payload.vip_asset = data.vipAsset;
    if (data.savedCheats !== undefined) payload.saved_cheats = data.savedCheats;
    if (data.savedNews !== undefined) payload.saved_news = data.savedNews;

    const conflictCol = isUuid ? 'id' : 'device_id';
    await supabase.from('profiles').upsert(payload, { onConflict: conflictCol });
  } catch (err) {
    console.warn('Could not save user cloud profile to Supabase table:', err);
  }
}

/**
 * Subscribes to Supabase Auth state changes
 */
export function onAuthStateChanged(
  _dummyAuth: any,
  callback: (user: AuthUser | null) => void
): () => void {
  // Check current session immediately
  supabase.auth.getSession().then(({ data }) => {
    if (data?.session?.user) {
      callback(mapSupabaseUser(data.session.user));
    } else {
      callback(null);
    }
  });

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback(mapSupabaseUser(session.user));
    } else {
      callback(null);
    }
  });

  return () => {
    listener?.subscription?.unsubscribe();
  };
}

export const auth = supabase.auth;
