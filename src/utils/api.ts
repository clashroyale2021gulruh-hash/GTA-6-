/**
 * GTA 6 Companion - Safe API & Network Utilities for Web & Capacitor Android
 * Prevents HTML response parsing crashes (Unexpected token '<'), provides absolute
 * URL resolution for mobile APK builds, and safely handles external navigation.
 */

import { Capacitor } from '@capacitor/core';

// Cloud server URL for mobile APK when running in native Capacitor without local Node server
export const FALLBACK_CLOUD_API = 'https://ais-dev-2ha56of3o32oeuhupyk6fl-213457543212.asia-east1.run.app';

/**
 * Returns true if running as a native Android/iOS Capacitor application
 */
export function isCapacitorNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Resolves the base API URL:
 * - On Mobile (Capacitor/Android APK): Uses configured VITE_API_BASE_URL or remote Cloud backend
 * - On Web: Uses window.location.origin if available, or relative path
 */
export function getApiBaseUrl(): string {
  const env = (import.meta as any).env;
  if (env && env.VITE_API_BASE_URL) {
    return String(env.VITE_API_BASE_URL).replace(/\/$/, '');
  }

  if (isCapacitorNative()) {
    return FALLBACK_CLOUD_API;
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    // If running in browser over http/https (and not file:// or capacitor://)
    if (origin.startsWith('http://') || origin.startsWith('https://')) {
      return origin;
    }
  }

  return '';
}

/**
 * Resolves a full absolute URL for any API endpoint
 */
export function resolveApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  isHtmlResponse?: boolean;
}

/**
 * Safely fetches an API endpoint and strictly verifies that response is JSON
 * Prevents "Unexpected token '<'" crash when an endpoint returns an HTML 404/500 page.
 */
export async function safeFetchJson<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  const fullUrl = resolveApiUrl(endpoint);

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {})
      }
    });

    const contentType = res.headers?.get('content-type') || '';

    // Check if the server returned an HTML error page (404/500) instead of JSON
    if (!contentType.toLowerCase().includes('application/json')) {
      const rawText = await res.text().catch(() => '');
      return {
        ok: false,
        status: res.status,
        isHtmlResponse: true,
        error: `Сервер вернул HTML вместо JSON (HTTP ${res.status}). Проверьте доступность бэкенда.`
      };
    }

    try {
      const data = (await res.json()) as T;
      return {
        ok: res.ok,
        status: res.status,
        data
      };
    } catch (parseErr: any) {
      return {
        ok: false,
        status: res.status,
        error: `Ошибка чтения JSON: ${parseErr?.message || 'Некорректный формат данных'}`
      };
    }
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      error: `Ошибка сети: ${netErr?.message || 'Сервер недоступен'}`
    };
  }
}

/**
 * Safely opens an external link in system browser / Telegram without crashing the WebView
 */
export function openExternalUrl(url: string): void {
  if (!url) return;

  try {
    // In Capacitor or WebView, target '_system' opens system Chrome/browser or native app handler (e.g. Telegram)
    const opened = window.open(url, '_system');
    if (!opened) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.warn('Fallback opening external URL:', err);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Ignored if completely blocked by browser
    }
  }
}
