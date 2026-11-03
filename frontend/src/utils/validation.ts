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

export function normalizeUserId(userId: string): string {
  const cleaned = userId.trim().replace(/^@+/, '').toLowerCase();
  return cleaned ? `@${cleaned}` : '';
}
