import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

export interface DeviceProfile {
  displayName: string;
  avatarUrl: string;
  statusText: string;
  isVip: boolean;
  vipInvoiceId?: number | string;
  vipVerifiedAt?: string;
  vipAmount?: string;
  vipAsset?: string;
  activationMethod?: 'cryptobot' | 'license_key';
}

export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

// List of pre-authorized VIP license keys
export const VALID_VIP_KEYS = new Set([
  'VIP-LEONIDA-2026',
  'LEONIDA-VIP-PASS',
  'GTA6-VIP-ACCESS',
  'LEONIDA2026',
  'VIP-VICE-CITY',
  'ROCKSTAR-VIP-2026'
]);

/**
 * Validates a VIP activation key.
 * Accepts recognized promotional keys or formatted VIP keys (VIP-XXXX-XXXX).
 */
export function validateVipKey(rawKey: string): boolean {
  if (!rawKey) return false;
  const cleanKey = rawKey.trim().toUpperCase();
  if (VALID_VIP_KEYS.has(cleanKey)) return true;
  // Also support standard VIP license key format (e.g. VIP-XXXX-XXXX with >= 10 chars)
  if (/^VIP-[A-Z0-9]{4,12}-[A-Z0-9]{4,12}$/i.test(cleanKey)) return true;
  if (/^LEONIDA-[A-Z0-9]{4,12}$/i.test(cleanKey)) return true;
  return false;
}

let cachedDeviceId: string | null = null;

/**
 * Retrieves hardware Device ID using @capacitor/device (Device.getId())
 * with persistent local fallback for Web and Android environments.
 */
export async function getHardwareDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  // 1. Try native Device plugin
  try {
    const info = await Device.getId();
    if (info && typeof info.identifier === 'string' && info.identifier.trim()) {
      cachedDeviceId = info.identifier.trim();
      return cachedDeviceId;
    }
  } catch (err) {
    console.warn('Native Device.getId() notice (using fallback):', err);
  }

  // 2. Check stored ID in Preferences
  try {
    const { value } = await Preferences.get({ key: 'gta6_hardware_device_id' });
    if (value && value.trim()) {
      cachedDeviceId = value.trim();
      return cachedDeviceId;
    }
  } catch {
    // fallback
  }

  // 3. Check localStorage fallback
  try {
    const lsVal = localStorage.getItem('gta6_hardware_device_id');
    if (lsVal && lsVal.trim()) {
      cachedDeviceId = lsVal.trim();
      return cachedDeviceId;
    }
  } catch {
    // fallback
  }

  // 4. Generate persistent hardware-locked UUID
  const generatedId =
    'leonida_dev_' +
    Math.random().toString(36).substring(2, 10) +
    '_' +
    Date.now().toString(36);

  cachedDeviceId = generatedId;
  try {
    await Preferences.set({ key: 'gta6_hardware_device_id', value: generatedId });
    localStorage.setItem('gta6_hardware_device_id', generatedId);
  } catch {
    // ignore
  }

  return generatedId;
}

function getKey(deviceId: string, suffix: string): string {
  return `gta6_${deviceId}_${suffix}`;
}

/**
 * Loads all key persisted app data from @capacitor/preferences
 * bound to the hardware Device ID.
 * Guarantees a fully valid, non-null default state on first launch.
 */
export async function loadDeviceStorageData(): Promise<{
  deviceId: string;
  favCheats: string[];
  favNews: string[];
  isVip: boolean;
  profile: DeviceProfile;
}> {
  const deviceId = await getHardwareDeviceId();

  let favCheats: string[] = [];
  let favNews: string[] = [];
  let isVip = false;
  let profile: DeviceProfile = {
    displayName: 'Игрок Leonida',
    avatarUrl: DEFAULT_AVATAR,
    statusText: 'Игрок Leonida',
    isVip: false
  };

  try {
    const [cheatsRes, newsRes, vipRes, profileRes] = await Promise.all([
      Preferences.get({ key: getKey(deviceId, 'fav_cheats') }).catch(() => ({ value: null })),
      Preferences.get({ key: getKey(deviceId, 'fav_news') }).catch(() => ({ value: null })),
      Preferences.get({ key: getKey(deviceId, 'is_vip') }).catch(() => ({ value: null })),
      Preferences.get({ key: getKey(deviceId, 'profile') }).catch(() => ({ value: null }))
    ]);

    // Parse Cheats
    if (cheatsRes?.value) {
      try {
        const parsed = JSON.parse(cheatsRes.value);
        if (Array.isArray(parsed)) favCheats = parsed.filter((x) => typeof x === 'string');
      } catch {}
    } else {
      // LocalStorage fallback check
      try {
        const ls = localStorage.getItem(getKey(deviceId, 'fav_cheats'));
        if (ls) {
          const parsed = JSON.parse(ls);
          if (Array.isArray(parsed)) favCheats = parsed;
        }
      } catch {}
    }

    // Parse News
    if (newsRes?.value) {
      try {
        const parsed = JSON.parse(newsRes.value);
        if (Array.isArray(parsed)) favNews = parsed.filter((x) => typeof x === 'string');
      } catch {}
    } else {
      try {
        const ls = localStorage.getItem(getKey(deviceId, 'fav_news'));
        if (ls) {
          const parsed = JSON.parse(ls);
          if (Array.isArray(parsed)) favNews = parsed;
        }
      } catch {}
    }

    // Parse VIP
    if (vipRes?.value === 'true') {
      isVip = true;
    } else {
      try {
        if (localStorage.getItem(getKey(deviceId, 'is_vip')) === 'true') {
          isVip = true;
        }
      } catch {}
    }

    // Parse Profile
    if (profileRes?.value) {
      try {
        const parsed = JSON.parse(profileRes.value);
        if (parsed && typeof parsed === 'object') {
          profile = {
            displayName: parsed.displayName || 'Игрок Leonida',
            avatarUrl: parsed.avatarUrl || DEFAULT_AVATAR,
            statusText: parsed.statusText || (isVip ? 'Пожизненный Leonida VIP Pass' : 'Игрок Leonida'),
            isVip: Boolean(parsed.isVip || isVip),
            vipInvoiceId: parsed.vipInvoiceId,
            vipVerifiedAt: parsed.vipVerifiedAt,
            vipAmount: parsed.vipAmount,
            vipAsset: parsed.vipAsset,
            activationMethod: parsed.activationMethod
          };
          if (profile.isVip) isVip = true;
        }
      } catch {}
    }

    if (isVip && !profile.isVip) {
      profile.isVip = true;
      profile.statusText = 'Пожизненный Leonida VIP Pass';
    }
  } catch (err) {
    console.warn('Error reading device preferences (safe defaults applied):', err);
  }

  return {
    deviceId,
    favCheats,
    favNews,
    isVip,
    profile
  };
}

/**
 * Saves favorite cheats to @capacitor/preferences bound to device ID
 */
export async function saveFavoriteCheats(favs: string[]): Promise<void> {
  try {
    const deviceId = await getHardwareDeviceId();
    const val = JSON.stringify(favs);
    await Preferences.set({
      key: getKey(deviceId, 'fav_cheats'),
      value: val
    });
    try {
      localStorage.setItem(getKey(deviceId, 'fav_cheats'), val);
    } catch {}
  } catch (err) {
    console.warn('Safe catch in saveFavoriteCheats:', err);
  }
}

/**
 * Saves favorite news to @capacitor/preferences bound to device ID
 */
export async function saveFavoriteNews(favs: string[]): Promise<void> {
  try {
    const deviceId = await getHardwareDeviceId();
    const val = JSON.stringify(favs);
    await Preferences.set({
      key: getKey(deviceId, 'fav_news'),
      value: val
    });
    try {
      localStorage.setItem(getKey(deviceId, 'fav_news'), val);
    } catch {}
  } catch (err) {
    console.warn('Safe catch in saveFavoriteNews:', err);
  }
}

/**
 * Saves VIP status and invoice details to @capacitor/preferences bound to device ID
 */
export async function saveVipStatus(
  isVip: boolean,
  details?: {
    invoiceId?: number | string;
    amount?: string;
    asset?: string;
    verifiedAt?: string;
    method?: 'cryptobot' | 'license_key';
  }
): Promise<void> {
  try {
    const deviceId = await getHardwareDeviceId();
    const vipVal = isVip ? 'true' : 'false';

    await Preferences.set({
      key: getKey(deviceId, 'is_vip'),
      value: vipVal
    });

    try {
      localStorage.setItem(getKey(deviceId, 'is_vip'), vipVal);
    } catch {}

    if (details) {
      const detailsVal = JSON.stringify(details);
      await Preferences.set({
        key: getKey(deviceId, 'vip_invoice'),
        value: detailsVal
      });
      try {
        localStorage.setItem(getKey(deviceId, 'vip_invoice'), detailsVal);
      } catch {}
    }

    // Update profile object
    const currentProfileStr = (await Preferences.get({ key: getKey(deviceId, 'profile') })).value;
    let profileObj: DeviceProfile = {
      displayName: 'Игрок Leonida',
      avatarUrl: DEFAULT_AVATAR,
      statusText: isVip ? 'Пожизненный Leonida VIP Pass' : 'Игрок Leonida',
      isVip
    };

    if (currentProfileStr) {
      try {
        profileObj = { ...JSON.parse(currentProfileStr), isVip };
      } catch {}
    }

    profileObj.isVip = isVip;
    profileObj.statusText = isVip ? 'Пожизненный Leonida VIP Pass' : 'Игрок Leonida';
    if (details) {
      profileObj.vipInvoiceId = details.invoiceId;
      profileObj.vipAmount = details.amount;
      profileObj.vipAsset = details.asset;
      profileObj.vipVerifiedAt = details.verifiedAt || new Date().toISOString();
      profileObj.activationMethod = details.method || (details.invoiceId ? 'cryptobot' : 'license_key');
    }

    const profileVal = JSON.stringify(profileObj);
    await Preferences.set({
      key: getKey(deviceId, 'profile'),
      value: profileVal
    });
    try {
      localStorage.setItem(getKey(deviceId, 'profile'), profileVal);
    } catch {}
  } catch (err) {
    console.warn('Safe catch in saveVipStatus:', err);
  }
}

/**
 * Saves profile data to @capacitor/preferences bound to device ID
 */
export async function saveDeviceProfile(profile: DeviceProfile): Promise<void> {
  try {
    const deviceId = await getHardwareDeviceId();
    const val = JSON.stringify(profile);
    await Preferences.set({
      key: getKey(deviceId, 'profile'),
      value: val
    });
    try {
      localStorage.setItem(getKey(deviceId, 'profile'), val);
    } catch {}
  } catch (err) {
    console.warn('Safe catch in saveDeviceProfile:', err);
  }
}
