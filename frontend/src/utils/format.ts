export function formatINR(amount: number, compact = false): string {
  if (compact) {
    return `₹${new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRInput(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('en-IN').format(Number(digits));
}

export function parseINRInput(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

export function maskPhone(countryCode: string, phone: string): string {
  if (phone.length < 4) return `${countryCode} ${phone}`;
  const visible = phone.slice(-4);
  const masked = '•'.repeat(Math.max(phone.length - 4, 0));
  return `${countryCode} ${masked}${visible}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${'•'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatTransactionDate(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || 'there';
}

export function progressRatio(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(current / total, 0), 1);
}
