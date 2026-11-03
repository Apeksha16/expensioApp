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

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || 'there';
}

export function progressRatio(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(current / total, 0), 1);
}
