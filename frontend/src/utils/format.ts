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

export function formatDisplayDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : '';
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatRelativeUpdatedAt(timestamp: number | null, now = Date.now()): string {
  if (!timestamp) return '';
  const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSeconds < 45) return 'Updated just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours} hr ago`;
  return `Updated ${formatDisplayDate(new Date(timestamp))}`;
}

export function formatClockTime(timestamp: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatCompactAge(isoDate?: string | null, now = Date.now()): string {
  if (!isoDate) return '';
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return '';
  const diffMinutes = Math.max(0, Math.floor((now - parsed) / 60_000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDisplayDate(new Date(parsed));
}

