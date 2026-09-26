/**
 * Expensio Data Formatters
 * 100% portable pure business logic for numbers, dates, and text formatting.
 */

export const formatters = {
  /**
   * Formats numbers to clean Indian Rupee notation (e.g. ₹31,169 or ₹12.50).
   */
  currency(amount: number): string {
    const isNegative = amount < 0;
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    });
    return `${isNegative ? '-' : ''}₹${formatted}`;
  },

  /**
   * Standardizes transaction timestamps to human-friendly dates.
   */
  timestamp(date: Date = new Date()): string {
    return (
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      `, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    );
  },

  /**
   * Masks a mobile number for privacy (e.g. +91 ••••• •3210).
   */
  maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    const last4 = cleaned.slice(-4);
    return `+91 ••••• •${last4}`;
  },

  /**
   * Capitalizes first letter of each word.
   */
  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
};
