import type { PaymentCadence } from '../types';

export function validatePositiveAmount(amount: number, label: string): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Enter a ${label} greater than zero.`);
  }
}

export function validateDate(value: string, label: string): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Choose a valid ${label}.`);
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1])
    || date.getMonth() !== Number(match[2]) - 1
    || date.getDate() !== Number(match[3])
  ) {
    throw new Error(`Choose a valid ${label}.`);
  }
}

export function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function advancePaymentDate(value: string, cadence: PaymentCadence, today = new Date()): string {
  validateDate(value, 'due date');
  const [year, month, day] = value.split('-').map(Number);
  let next = new Date(year, month - 1, day);
  const addInterval = (date: Date) => {
    if (cadence === 'weekly') {
      date.setDate(date.getDate() + 7);
    } else if (cadence === 'monthly') {
      const targetMonth = date.getMonth() + 1;
      const targetDay = date.getDate();
      date.setDate(1);
      date.setMonth(targetMonth);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(targetDay, lastDay));
    } else {
      const targetMonth = date.getMonth();
      const targetDay = date.getDate();
      date.setDate(1);
      date.setFullYear(date.getFullYear() + 1);
      const lastDay = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
      date.setMonth(targetMonth);
      date.setDate(Math.min(targetDay, lastDay));
    }
  };
  do {
    addInterval(next);
  } while (next < new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  return localDateString(next);
}
