export function isValidIndianMobile(phone: string, dial = '+91'): boolean {
  const cleaned = phone.replace(/\s/g, '');
  if (dial === '+91') return /^[6-9]\d{9}$/.test(cleaned);
  return /^\d{8,15}$/.test(cleaned);
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

export function isValidUserId(userId: string): boolean {
  const cleaned = userId.replace(/^@/, '');
  return /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(cleaned);
}

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  'qwerty123',
  'admin123',
  'welcome123',
  'expensio123',
]);

/**
 * Validates password against backend PasswordPolicyService:
 * - 8 to 128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character
 * - Not in common weak passwords blocklist
 */
export function validatePasswordPolicy(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (password.length > 128) {
    return 'Password must not exceed 128 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter (A-Z)';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter (a-z)';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit (0-9)';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%...)';
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    return 'Password is too common or easily guessable';
  }
  return null;
}

export function normalizeUserId(userId: string): string {
  const cleaned = userId.trim().replace(/^@+/, '').toLowerCase();
  return cleaned ? `@${cleaned}` : '';
}
