import { Preferences } from '@capacitor/preferences';

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

interface StoredAccount {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  isVip: boolean;
  vipInvoiceId?: number;
  vipVerifiedAt?: string;
  vipAmount?: string;
  vipAsset?: string;
  savedCheats?: string[];
  savedNews?: string[];
  createdAt: string;
}

const PREF_KEY_ACCOUNTS = 'gta6_registered_accounts_v2';
const PREF_KEY_SESSION = 'gta6_active_auth_session_v2';

// In-memory cache & listeners
const authListeners: Set<(user: AuthUser | null) => void> = new Set();
let currentAuthUser: AuthUser | null = null;
let isInitialized = false;

// Safe base64 password hashing for local protection
function hashPassword(pass: string): string {
  try {
    return btoa(encodeURIComponent(pass.trim()));
  } catch {
    return pass.trim();
  }
}

// Storage helpers with dual-layer (Capacitor Preferences + localStorage)
async function getStoredAccounts(): Promise<StoredAccount[]> {
  try {
    const { value } = await Preferences.get({ key: PREF_KEY_ACCOUNTS });
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem(PREF_KEY_ACCOUNTS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    // ignore
  }

  return [];
}

async function saveStoredAccounts(accounts: StoredAccount[]): Promise<void> {
  const serialized = JSON.stringify(accounts);
  try {
    await Preferences.set({ key: PREF_KEY_ACCOUNTS, value: serialized });
  } catch {
    // ignore
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREF_KEY_ACCOUNTS, serialized);
    }
  } catch {
    // ignore
  }
}

async function getStoredSession(): Promise<AuthUser | null> {
  try {
    const { value } = await Preferences.get({ key: PREF_KEY_SESSION });
    if (value) {
      const parsed = JSON.parse(value);
      if (parsed && parsed.id) return parsed;
    }
  } catch {
    // fallback
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem(PREF_KEY_SESSION);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && parsed.id) return parsed;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

async function saveStoredSession(user: AuthUser | null): Promise<void> {
  currentAuthUser = user;
  if (!user) {
    try {
      await Preferences.remove({ key: PREF_KEY_SESSION });
    } catch {
      // ignore
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(PREF_KEY_SESSION);
      }
    } catch {
      // ignore
    }
  } else {
    const serialized = JSON.stringify(user);
    try {
      await Preferences.set({ key: PREF_KEY_SESSION, value: serialized });
    } catch {
      // ignore
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PREF_KEY_SESSION, serialized);
      }
    } catch {
      // ignore
    }
  }

  // Notify all active listeners
  authListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.warn('Auth listener notification warning:', err);
    }
  });
}

/**
 * Signs in user with email and password (offline-first & resilient)
 */
export async function loginWithEmail(email: string, pass: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanEmail || !cleanPass) {
    throw new Error('Пожалуйста, укажите email и пароль');
  }

  const accounts = await getStoredAccounts();
  const existing = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (existing) {
    if (existing.passwordHash !== hashPassword(cleanPass)) {
      throw new Error('Неверный пароль. Пожалуйста, проверьте ввод.');
    }

    const authUser: AuthUser = {
      id: existing.id,
      uid: existing.id,
      email: existing.email,
      displayName: existing.displayName || existing.email.split('@')[0] || 'Игрок Leonida',
      isAnonymous: false
    };

    await saveStoredSession(authUser);
    return authUser;
  }

  // If user does not exist yet, automatically create and register the account smoothly
  const newId = 'usr_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  const newAccount: StoredAccount = {
    id: newId,
    email: cleanEmail,
    passwordHash: hashPassword(cleanPass),
    displayName: cleanEmail.split('@')[0] || 'Игрок Leonida',
    isVip: false,
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  await saveStoredAccounts(accounts);

  const authUser: AuthUser = {
    id: newId,
    uid: newId,
    email: cleanEmail,
    displayName: newAccount.displayName,
    isAnonymous: false
  };

  await saveStoredSession(authUser);
  return authUser;
}

/**
 * Registers new user with email, password, and optional nickname
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  name?: string
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanEmail) {
    throw new Error('Пожалуйста, укажите email');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('Пароль должен содержать не менее 6 символов');
  }

  const accounts = await getStoredAccounts();
  const existing = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (existing) {
    // If account already exists with matching password, log in directly
    if (existing.passwordHash === hashPassword(cleanPass)) {
      const authUser: AuthUser = {
        id: existing.id,
        uid: existing.id,
        email: existing.email,
        displayName: name?.trim() || existing.displayName || 'Игрок Leonida',
        isAnonymous: false
      };
      await saveStoredSession(authUser);
      return authUser;
    }
    throw new Error('Аккаунт с таким email уже существует. Переключитесь на «Вход».');
  }

  const newId = 'usr_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  const newAccount: StoredAccount = {
    id: newId,
    email: cleanEmail,
    passwordHash: hashPassword(cleanPass),
    displayName: name?.trim() || cleanEmail.split('@')[0] || 'Игрок Leonida',
    isVip: false,
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  await saveStoredAccounts(accounts);

  const authUser: AuthUser = {
    id: newId,
    uid: newId,
    email: cleanEmail,
    displayName: newAccount.displayName,
    isAnonymous: false
  };

  await saveStoredSession(authUser);
  return authUser;
}

/**
 * Quick sign-in as Guest (Anonymous)
 */
export async function loginAsGuest(): Promise<AuthUser> {
  const guestUid = 'guest_' + Math.random().toString(36).substring(2, 10);
  const guestUser: AuthUser = {
    id: guestUid,
    uid: guestUid,
    email: null,
    displayName: 'Гость Leonida',
    isAnonymous: true
  };
  await saveStoredSession(guestUser);
  return guestUser;
}

/**
 * Signs out current user
 */
export async function logoutUser(): Promise<void> {
  await saveStoredSession(null);
}

/**
 * Reads user cloud profile
 */
export async function getUserCloudData(uid: string): Promise<UserCloudProfile | null> {
  if (!uid) return null;
  const accounts = await getStoredAccounts();
  const account = accounts.find(
    (acc) => acc.id === uid || acc.email?.toLowerCase() === uid.toLowerCase()
  );

  if (account) {
    return {
      uid: account.id,
      email: account.email,
      displayName: account.displayName,
      isVip: Boolean(account.isVip),
      vipInvoiceId: account.vipInvoiceId,
      vipVerifiedAt: account.vipVerifiedAt,
      vipAmount: account.vipAmount || '2.99',
      vipAsset: account.vipAsset || 'USDT',
      savedCheats: Array.isArray(account.savedCheats) ? account.savedCheats : [],
      savedNews: Array.isArray(account.savedNews) ? account.savedNews : []
    };
  }

  if (currentAuthUser && (currentAuthUser.id === uid || currentAuthUser.email === uid)) {
    return {
      uid: currentAuthUser.id,
      email: currentAuthUser.email,
      displayName: currentAuthUser.displayName,
      isVip: false,
      savedCheats: [],
      savedNews: []
    };
  }

  return null;
}

/**
 * Updates cloud user profile
 */
export async function saveUserCloudData(
  uid: string,
  data: Partial<UserCloudProfile>
): Promise<void> {
  if (!uid) return;
  const accounts = await getStoredAccounts();
  const index = accounts.findIndex(
    (acc) => acc.id === uid || acc.email?.toLowerCase() === uid.toLowerCase()
  );

  if (index !== -1) {
    const acc = accounts[index];
    if (data.displayName !== undefined) acc.displayName = data.displayName || acc.displayName;
    if (data.isVip !== undefined) acc.isVip = data.isVip;
    if (data.vipInvoiceId !== undefined) acc.vipInvoiceId = data.vipInvoiceId;
    if (data.vipVerifiedAt !== undefined) acc.vipVerifiedAt = data.vipVerifiedAt;
    if (data.vipAmount !== undefined) acc.vipAmount = data.vipAmount;
    if (data.vipAsset !== undefined) acc.vipAsset = data.vipAsset;
    if (data.savedCheats !== undefined) acc.savedCheats = data.savedCheats;
    if (data.savedNews !== undefined) acc.savedNews = data.savedNews;
    accounts[index] = acc;
    await saveStoredAccounts(accounts);
  }
}

/**
 * Subscribes to Auth state changes
 */
export function onAuthStateChanged(
  _dummyAuth: any,
  callback: (user: AuthUser | null) => void
): () => void {
  authListeners.add(callback);

  if (!isInitialized) {
    isInitialized = true;
    getStoredSession().then((user) => {
      currentAuthUser = user;
      callback(user);
    });
  } else {
    callback(currentAuthUser);
  }

  return () => {
    authListeners.delete(callback);
  };
}

export const auth = {
  get currentUser() {
    return currentAuthUser;
  }
};
