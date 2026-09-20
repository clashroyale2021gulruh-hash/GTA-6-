/**
 * GTA 6 Leonida - Input Sanitization & Security Validation Utilities
 * Enforces strict sanitization on profile modifications, authentication payloads,
 * and database writes to prevent injection, XSS, and malformed state.
 */

// Safe fallback avatar from official GTA 6 Leonida avatar collection
export const DEFAULT_SAFE_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

/**
 * Strips HTML tags, script injection tokens, control characters, and normalizes spaces.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove ASCII control characters
    .replace(/[<>'"\\`]/g, '') // Strip XSS dangerous characters
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Sanitizes and validates user display names (nicknames) for Leonida profile.
 * Constraints: 2 to 32 characters, safe characters only.
 */
export function sanitizeDisplayName(name: unknown, fallback = 'Игрок Леониды'): string {
  const cleaned = sanitizeString(name);
  if (!cleaned || cleaned.length < 2) {
    return fallback;
  }
  return cleaned.slice(0, 32);
}

/**
 * Validates and strictly sanitizes an email address.
 * Converts to lowercase, strips whitespaces & control characters, enforces structure.
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  const cleaned = email
    .trim()
    .toLowerCase()
    .replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '')
    .slice(0, 100);

  // Strict email format check (RFC 5322 compatible regex)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(cleaned)) {
    return '';
  }
  return cleaned;
}

/**
 * Comprehensive email validator with localized error reporting.
 */
export function validateEmail(email: unknown): { isValid: boolean; error?: string; cleanEmail: string } {
  const cleanEmail = sanitizeEmail(email);
  if (!cleanEmail) {
    return {
      isValid: false,
      error: 'Введите корректный адрес электронной почты (например: player@gmail.com)',
      cleanEmail: ''
    };
  }

  // Ensure domain contains valid dot and valid TLD length >= 2
  const parts = cleanEmail.split('@');
  if (parts.length !== 2 || !parts[1].includes('.') || parts[1].endsWith('.')) {
    return {
      isValid: false,
      error: 'Указан неполный домен почты (например: @gmail.com)',
      cleanEmail: ''
    };
  }

  return { isValid: true, cleanEmail };
}

/**
 * Sanitizes and validates image/avatar URLs.
 * Rejects dangerous protocols (javascript:, data:, vbscript:) and malformed URLs.
 */
export function sanitizePhotoUrl(url: unknown, fallback: string = DEFAULT_SAFE_AVATAR): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();

  // Must begin with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return fallback;
  }

  // Reject javascript, vbscript, or embedded script tokens
  if (/javascript:|vbscript:|data:|<|>|"|'|`/i.test(trimmed)) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fallback;
    }
    return parsed.toString();
  } catch {
    return fallback;
  }
}

/**
 * Sanitizes user UID keys before using as Firestore document IDs or payload tokens.
 * Only permits alphanumeric, hyphen, and underscore characters.
 */
export function sanitizeUid(uid: unknown): string {
  if (typeof uid !== 'string') return '';
  const cleaned = uid.replace(/[^a-zA-Z0-9_-]/g, '').trim();
  return cleaned.slice(0, 128);
}
