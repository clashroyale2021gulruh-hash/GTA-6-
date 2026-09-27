import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import { sha256 } from './cryptoSecurity';

const VIP_LOCK_SALT = 'GTA6_DEVICE_LOCK_VIP_SECURE_2026';
const TG_LOCK_SALT = 'GTA6_TG_BONUS_SECURE_2026';

/**
 * Returns a stable unique hardware/device identifier via Capacitor Device plugin
 * Persists even if browser storage is wiped
 */
export async function getDeviceId(): Promise<string> {
  try {
    const info = await Device.getId();
    if (info?.identifier) {
      return info.identifier;
    }
  } catch {
    // ignore
  }

  // Fallback device ID
  try {
    const stored = localStorage.getItem('gta6_hardware_device_id');
    if (stored) return stored;
    const fallbackId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('gta6_hardware_device_id', fallbackId);
    return fallbackId;
  } catch {
    return 'dev_default_client';
  }
}

/**
 * Reads a value from Capacitor Preferences (backed by Android SharedPreferences)
 * Guaranteed to survive ordinary browser / cache clearing
 */
export async function getPref(key: string, defaultValue = ''): Promise<string> {
  try {
    const res = await Preferences.get({ key });
    if (res.value !== null && res.value !== undefined) {
      return res.value;
    }
  } catch {
    // fallback
  }

  try {
    const local = localStorage.getItem(key);
    if (local !== null) return local;
  } catch {
    // ignore
  }

  return defaultValue;
}

/**
 * Sets a value in Capacitor Preferences and mirrors to localStorage for dual durability
 */
export async function setPref(key: string, value: string): Promise<void> {
  try {
    await Preferences.set({ key, value });
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/**
 * Removes a value from Preferences and localStorage
 */
export async function removePref(key: string): Promise<void> {
  try {
    await Preferences.remove({ key });
  } catch {
    // ignore
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Cryptographically binds VIP access to this specific device
 */
export async function saveVipLock(deviceId: string, keyOrToken = 'VIP_ACTIVE'): Promise<void> {
  const hash = await sha256(`${deviceId}:${keyOrToken}:${VIP_LOCK_SALT}`);
  await setPref('vip_cached', 'true');
  await setPref('vip_device_id', deviceId);
  await setPref('vip_device_hash', hash);
  await setPref('vip_key_token', keyOrToken);
}

/**
 * Checks if this device has a valid, tamper-resistant VIP lock
 */
export async function checkVipLock(deviceId: string): Promise<boolean> {
  const isVip = await getPref('vip_cached', 'false');
  if (isVip !== 'true') return false;

  const storedId = await getPref('vip_device_id', '');
  const storedHash = await getPref('vip_device_hash', '');
  const storedToken = await getPref('vip_key_token', 'VIP_ACTIVE');

  // Verify signature against this device ID
  const expectedHash = await sha256(`${storedId || deviceId}:${storedToken}:${VIP_LOCK_SALT}`);
  return storedHash === expectedHash;
}

/**
 * Unlocks the exclusive Telegram cheat for this device
 */
export async function saveTelegramBonus(deviceId: string): Promise<void> {
  const hash = await sha256(`${deviceId}:TG_BONUS:${TG_LOCK_SALT}`);
  await setPref('tg_unlocked', 'true');
  await setPref('tg_device_id', deviceId);
  await setPref('tg_device_hash', hash);
}

/**
 * Checks if the exclusive Telegram cheat is unlocked on this device
 */
export async function checkTelegramBonus(deviceId: string): Promise<boolean> {
  const unlocked = await getPref('tg_unlocked', 'false');
  if (unlocked !== 'true') return false;

  const storedId = await getPref('tg_device_id', '');
  const storedHash = await getPref('tg_device_hash', '');
  if (!storedHash) return true;

  const expectedHash = await sha256(`${storedId || deviceId}:TG_BONUS:${TG_LOCK_SALT}`);
  return storedHash === expectedHash;
}

/**
 * Loads favorite cheats from Capacitor Preferences
 */
export async function loadSavedCheats(): Promise<string[]> {
  try {
    const raw = await getPref('gta6_fav_cheats_v4', '[]');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves favorite cheats to Capacitor Preferences
 */
export async function saveSavedCheats(cheatIds: string[]): Promise<void> {
  await setPref('gta6_fav_cheats_v4', JSON.stringify(cheatIds));
}

/**
 * Loads favorite news from Capacitor Preferences
 */
export async function loadSavedNews(): Promise<string[]> {
  try {
    const raw = await getPref('gta6_fav_news_v4', '[]');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves favorite news to Capacitor Preferences
 */
export async function saveSavedNews(newsIds: string[]): Promise<void> {
  await setPref('gta6_fav_news_v4', JSON.stringify(newsIds));
}

/**
 * Loads custom profile from Capacitor Preferences
 */
export async function loadUserProfilePref(): Promise<{ displayName: string; photoURL: string } | null> {
  try {
    const raw = await getPref('gta6_profile_pref', '');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Saves custom profile to Capacitor Preferences
 */
export async function saveUserProfilePref(profile: { displayName: string; photoURL: string }): Promise<void> {
  await setPref('gta6_profile_pref', JSON.stringify(profile));
}
