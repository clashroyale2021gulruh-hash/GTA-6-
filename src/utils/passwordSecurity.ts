/**
 * Password Security & Anti-Hacking Validation Engine
 * Enforces strong password requirements for account registration:
 * - Minimum 8 characters
 * - Must include letters (latin or cyrillic)
 * - Must include numbers (0-9)
 * - Must include special characters/symbols (e.g., .,*!@#$%^& etc.)
 * - Disallows trivial/sequential passwords like "12345678", "qwertyui", repeating chars, etc.
 */

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0: Invalid, 1: Weak, 2: Fair, 3: Good, 4: Strong
  strengthLabel: string; // 'Очень слабый' | 'Слабый' | 'Средний' | 'Надежный'
  strengthColor: string; // Tailwind color class or hex
  hasMinLength: boolean;
  hasLetter: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  isCommonOrTrivial: boolean;
  trivialReason?: string;
  rules: PasswordRule[];
  errorMessages: string[];
}

// Known common / trivial passwords that attackers brute-force first
const TRIVIAL_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  '12344321',
  '12312312',
  '11223344',
  'password',
  'password123',
  'password1',
  'qwertyui',
  'qwertyuiop',
  'qwertzui',
  'asdfghjk',
  'zxcvbnm1',
  'admin123',
  'administrator',
  'gta6companion',
  'vicecity1',
  'vicecity123'
]);

/**
 * Checks for common repeating patterns (e.g., "11111111", "aaaaaa..")
 */
function hasRepeatingSequence(pwd: string): boolean {
  if (pwd.length < 4) return false;
  // All same character
  if (/^(.)\1+$/.test(pwd)) return true;
  // Repeating 2-character pairs like 12121212, abababab
  if (pwd.length >= 6 && /^(.{2})\1+$/.test(pwd)) return true;
  return false;
}

/**
 * Checks for numeric sequences like "01234567", "12345678", "98765432"
 */
function hasSequentialNumbers(pwd: string): boolean {
  const digitsOnly = pwd.replace(/\D/g, '');
  if (digitsOnly.length >= 5) {
    const sequences = ['0123456789', '9876543210'];
    for (const seq of sequences) {
      if (seq.includes(digitsOnly) && digitsOnly.length >= 6) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates password strength during registration
 */
export function validateRegistrationPassword(password: string): PasswordValidationResult {
  const clean = password.trim();

  const hasMinLength = clean.length >= 8;
  const hasLetter = /[a-zA-Zа-яА-ЯёЁ]/.test(clean);
  const hasDigit = /[0-9]/.test(clean);
  // Symbols including .,*!) and standard punctuation/special characters
  const hasSpecialChar = /[.,*!)~`@#$%^&(_+\-=\[\]{}|\\:;"'<>\/?]/.test(clean);

  // Check if trivial / sequential / known weak pattern
  const lower = clean.toLowerCase();
  let isCommonOrTrivial = false;
  let trivialReason = '';

  if (TRIVIAL_PASSWORDS.has(lower)) {
    isCommonOrTrivial = true;
    trivialReason = 'Этот пароль слишком популярен и легко взламывается хакерами';
  } else if (hasRepeatingSequence(clean)) {
    isCommonOrTrivial = true;
    trivialReason = 'Пароль состоит из повторяющихся символов';
  } else if (hasSequentialNumbers(clean) && !hasLetter && !hasSpecialChar) {
    isCommonOrTrivial = true;
    trivialReason = 'Простая числовая последовательность (например: 12345678)';
  }

  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: 'Минимум 8 символов',
      met: hasMinLength
    },
    {
      id: 'letters',
      label: 'Буквы (a-z, A-Z или русские)',
      met: hasLetter
    },
    {
      id: 'digits',
      label: 'Цифры (0-9)',
      met: hasDigit
    },
    {
      id: 'special',
      label: 'Знаки и символы (.,*!)@#$ и др.)',
      met: hasSpecialChar
    },
    {
      id: 'not_trivial',
      label: 'Без простых шаблонов (не 12345678)',
      met: !isCommonOrTrivial && clean.length > 0
    }
  ];

  // Calculate score (0 to 4)
  let score = 0;
  if (clean.length > 0) {
    if (hasMinLength) score += 1;
    if (hasLetter && hasDigit) score += 1;
    if (hasSpecialChar) score += 1;
    if (clean.length >= 10 && hasLetter && hasDigit && hasSpecialChar) score += 1;
    if (isCommonOrTrivial) score = Math.min(score, 1);
  }

  let strengthLabel = 'Очень слабый';
  let strengthColor = 'bg-rose-500';

  if (score === 0 || isCommonOrTrivial) {
    strengthLabel = isCommonOrTrivial ? 'Небезопасный (простой)' : 'Слишком простой';
    strengthColor = 'bg-rose-500';
  } else if (score === 1) {
    strengthLabel = 'Слабый пароль';
    strengthColor = 'bg-orange-500';
  } else if (score === 2) {
    strengthLabel = 'Средний пароль';
    strengthColor = 'bg-amber-400';
  } else if (score === 3) {
    strengthLabel = 'Хороший пароль';
    strengthColor = 'bg-lime-400';
  } else if (score >= 4) {
    strengthLabel = 'Надежный (хакероустойчивый)';
    strengthColor = 'bg-[#D4FF00]';
  }

  // Mandatory requirements: minimum 8 chars, letters, digits, and special chars, not trivial
  const isValid = hasMinLength && hasLetter && hasDigit && hasSpecialChar && !isCommonOrTrivial;

  const errorMessages: string[] = [];
  if (!clean) {
    errorMessages.push('Введите пароль');
  } else {
    if (isCommonOrTrivial) {
      errorMessages.push(trivialReason || 'Пароль слишком простой (например: 12345678). Хакеры легко подберут его.');
    }
    if (!hasMinLength) {
      errorMessages.push('Длина пароля должна быть не менее 8 символов');
    }
    if (!hasLetter) {
      errorMessages.push('Пароль обязательно должен содержать буквы');
    }
    if (!hasDigit) {
      errorMessages.push('Пароль обязательно должен содержать цифры (0-9)');
    }
    if (!hasSpecialChar) {
      errorMessages.push('Добавьте спецсимволы или знаки (например: .,*!@#%^)');
    }
  }

  return {
    isValid,
    score,
    strengthLabel,
    strengthColor,
    hasMinLength,
    hasLetter,
    hasDigit,
    hasSpecialChar,
    isCommonOrTrivial,
    trivialReason,
    rules,
    errorMessages
  };
}

/**
 * Generates a memorable, strong password meeting all criteria:
 * Length >= 10, uppercase, lowercase, numbers, and symbols like .,*!
 */
export function generateSecurePassword(): string {
  const words = ['Vice', 'Leonida', 'Jason', 'Lucia', 'Turbo', 'Shadow', 'Apex', 'Falcon', 'Viper', 'Ocean'];
  const symbols = ['.', '*', '!', '?', '@', '#', '$', '%'];
  const word = words[Math.floor(Math.random() * words.length)];
  const symbol1 = symbols[Math.floor(Math.random() * symbols.length)];
  const symbol2 = symbols[Math.floor(Math.random() * symbols.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}${symbol1}${num}${symbol2}`;
}
