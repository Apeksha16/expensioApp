import type { Transaction } from '../types';

export function getBudgetMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getTransactionMonthKey(transaction: Transaction): string | null {
  let date: Date;
  if (typeof transaction.occurredAt === 'number') {
    date = new Date(transaction.occurredAt);
  } else if (transaction.date === 'Today' || transaction.date === 'Yesterday') {
    date = new Date();
    if (transaction.date === 'Yesterday') date.setDate(date.getDate() - 1);
  } else {
    const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(transaction.date);
    date = isoDate
      ? new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]))
      : new Date(`${transaction.date} ${new Date().getFullYear()}`);
  }
  return Number.isNaN(date.getTime()) ? null : getBudgetMonthKey(date);
}
