import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

export interface DeviceProfile {
  displayName: string;
  avatarUrl: string;
  statusText: string;
  isVip: boolean;
  vipInvoiceId?: number;
  vipVerifiedAt?: string;
  vipAmount?: string;
  vipAsset?: string;
}

export const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

let cachedDeviceId: string | null = null;

/**
 * Retrieves hardware Device ID using @capacitor/device (Device.getId())
 * with persistent local fallback for Web/fallback environments.
 */
export async function getHardwareDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const info = await Device.getId();
    if (info && info.identifier && info.identifier.trim()) {
      cachedDeviceId = info.identifier.trim();
      return cachedDeviceId;
    }
  } catch (err) {
    console.warn('Could not read hardware device ID directly:', err);
  }

  // Check stored ID in Preferences
  try {
    const { value } = await Preferences.get({ key: 'gta6_hardware_device_id' });
    if (value && value.trim()) {
      cachedDeviceId = value.trim();
      return cachedDeviceId;
    }
  } catch {
    // fallback
  }

  // Generate a persistent hardware-locked UUID
  const generatedId =
    'leonida_dev_' +
    Math.random().toString(36).substring(2, 10) +
    '_' +
    Date.now().toString(36);

  cachedDeviceId = generatedId;
  try {
    await Preferences.set({ key: 'gta6_hardware_device_id', value: generatedId });
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
    const [cheatsRes, newsRes, vipRes, vipActiveRes, profileRes] = await Promise.all([
      Preferences.get({ key: getKey(deviceId, 'fav_cheats') }),
      Preferences.get({ key: getKey(deviceId, 'fav_news') }),
      Preferences.get({ key: getKey(deviceId, 'is_vip') }),
      Preferences.get({ key: 'vip_active' }),
      Preferences.get({ key: getKey(deviceId, 'profile') })
    ]);

    if (cheatsRes.value) {
      try {
        const parsed = JSON.parse(cheatsRes.value);
        if (Array.isArray(parsed)) favCheats = parsed;
      } catch {}
    }

    if (newsRes.value) {
      try {
        const parsed = JSON.parse(newsRes.value);
        if (Array.isArray(parsed)) favNews = parsed;
      } catch {}
    }

    if (vipRes.value === 'true' || vipActiveRes.value === 'true') {
      isVip = true;
    }

    if (profileRes.value) {
      try {
        const parsed = JSON.parse(profileRes.value);
        if (parsed && typeof parsed === 'object') {
          profile = {
            displayName: parsed.displayName || 'Игрок Leonida',
            avatarUrl: parsed.avatarUrl || DEFAULT_AVATAR,
            statusText: parsed.statusText || (isVip ? 'VIP Игрок ⚡' : 'Игрок Leonida'),
            isVip: Boolean(parsed.isVip || isVip),
            vipInvoiceId: parsed.vipInvoiceId,
            vipVerifiedAt: parsed.vipVerifiedAt,
            vipAmount: parsed.vipAmount,
            vipAsset: parsed.vipAsset
          };
          if (profile.isVip) isVip = true;
        }
      } catch {}
    }

    if (isVip && (!profile.isVip || profile.statusText !== 'VIP Игрок ⚡')) {
      profile.isVip = true;
      profile.statusText = 'VIP Игрок ⚡';
    }
  } catch (err) {
    console.warn('Error reading device preferences:', err);
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
  const deviceId = await getHardwareDeviceId();
  await Preferences.set({
    key: getKey(deviceId, 'fav_cheats'),
    value: JSON.stringify(favs)
  });
}

/**
 * Saves favorite news to @capacitor/preferences bound to device ID
 */
export async function saveFavoriteNews(favs: string[]): Promise<void> {
  const deviceId = await getHardwareDeviceId();
  await Preferences.set({
    key: getKey(deviceId, 'fav_news'),
    value: JSON.stringify(favs)
  });
}

/**
 * Saves VIP status and invoice details to @capacitor/preferences bound to device ID
 */
export async function saveVipStatus(
  isVip: boolean,
  invoiceDetails?: { invoiceId: number; amount: string; asset: string; verifiedAt?: string }
): Promise<void> {
  const deviceId = await getHardwareDeviceId();
  await Preferences.set({
    key: getKey(deviceId, 'is_vip'),
    value: isVip ? 'true' : 'false'
  });
  await Preferences.set({
    key: 'vip_active',
    value: isVip ? 'true' : 'false'
  });

  if (invoiceDetails) {
    await Preferences.set({
      key: getKey(deviceId, 'vip_invoice'),
      value: JSON.stringify(invoiceDetails)
    });
  }

  // Update profile in preferences
  const currentProfileStr = (await Preferences.get({ key: getKey(deviceId, 'profile') })).value;
  let profileObj: DeviceProfile = {
    displayName: 'Игрок Leonida',
    avatarUrl: DEFAULT_AVATAR,
    statusText: isVip ? 'VIP Игрок ⚡' : 'Игрок Leonida',
    isVip
  };

  if (currentProfileStr) {
    try {
      profileObj = { ...JSON.parse(currentProfileStr), isVip };
    } catch {}
  }

  profileObj.isVip = isVip;
  profileObj.statusText = isVip ? 'VIP Игрок ⚡' : 'Игрок Leonida';
  if (invoiceDetails) {
    profileObj.vipInvoiceId = invoiceDetails.invoiceId;
    profileObj.vipAmount = invoiceDetails.amount;
    profileObj.vipAsset = invoiceDetails.asset;
    profileObj.vipVerifiedAt = invoiceDetails.verifiedAt || new Date().toISOString();
  }

  await Preferences.set({
    key: getKey(deviceId, 'profile'),
    value: JSON.stringify(profileObj)
  });
}

/**
 * Saves profile data to @capacitor/preferences bound to device ID
 */
export async function saveDeviceProfile(profile: DeviceProfile): Promise<void> {
  const deviceId = await getHardwareDeviceId();
  await Preferences.set({
    key: getKey(deviceId, 'profile'),
    value: JSON.stringify(profile)
  });
}

/**
 * Loads cached news from @capacitor/preferences for instant offline availability
 */
export async function getCachedNews<T>(): Promise<T[] | null> {
  try {
    const { value } = await Preferences.get({ key: 'gta6_cached_news_feed' });
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading cached news feed:', err);
  }
  return null;
}

export interface PendingVipOrder {
  invoiceId: number;
  amount: string;
  asset: string;
  payUrl: string;
  status: 'created' | 'checking' | 'unpaid';
  lastCheckedAt?: string;
  createdAt: string;
}

export async function savePendingVipOrder(order: PendingVipOrder | null): Promise<void> {
  try {
    if (!order) {
      await Preferences.remove({ key: 'gta6_pending_vip_order' });
      try { localStorage.removeItem('gta6_pending_vip_order'); } catch {}
    } else {
      const serialized = JSON.stringify(order);
      await Preferences.set({ key: 'gta6_pending_vip_order', value: serialized });
      try { localStorage.setItem('gta6_pending_vip_order', serialized); } catch {}
    }
  } catch (err) {
    console.warn('Error saving pending VIP order:', err);
  }
}

export async function getPendingVipOrder(): Promise<PendingVipOrder | null> {
  try {
    const { value } = await Preferences.get({ key: 'gta6_pending_vip_order' });
    if (value) {
      return JSON.parse(value);
    }
    try {
      const local = localStorage.getItem('gta6_pending_vip_order');
      if (local) return JSON.parse(local);
    } catch {}
  } catch (err) {
    console.warn('Error reading pending VIP order:', err);
  }
  return null;
}

/**
 * Saves updated news items into @capacitor/preferences
 */
export async function saveCachedNews<T>(news: T[]): Promise<void> {
  try {
    await Preferences.set({
      key: 'gta6_cached_news_feed',
      value: JSON.stringify(news)
    });
  } catch (err) {
    console.warn('Error saving cached news feed:', err);
  }
}

/**
 * Gets last sync timestamp
 */
export async function getLastNewsSync(): Promise<string | null> {
  try {
    const { value } = await Preferences.get({ key: 'gta6_news_last_sync_time' });
    return value || null;
  } catch {
    return null;
  }
}

/**
 * Saves last sync timestamp
 */
export async function saveLastNewsSync(timestamp: string): Promise<void> {
  try {
    await Preferences.set({
      key: 'gta6_news_last_sync_time',
      value: timestamp
    });
  } catch {
    // ignore
  }
}


