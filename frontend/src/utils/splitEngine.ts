import type { SplitItem, SplitSummaryData } from '../types/index';

/**
 * Split Engine - Pure Business Logic
 * Zero side-effects, fully testable, and optimized for fintech accuracy.
 */

export const splitEngine = {
  /**
   * Splits an amount equally between participants with 2-decimal precision.
   */
  calculateEqualShare(totalAmount: number, participantCount: number): number {
    if (participantCount <= 0) return 0;
    if (totalAmount <= 0) return 0;
    return Math.round((totalAmount / participantCount) * 100) / 100;
  },

  /**
   * Computes aggregate balances: how much you are owed vs what you owe others.
   */
  computeSummary(splits: SplitItem[]): SplitSummaryData {
    let youllGet = 0;
    let youOwe = 0;
    let getPeople = 0;
    let owePeople = 0;

    for (const item of splits) {
      if (item.status === 'SETTLED') continue;

      if (item.youGet && item.youGet > 0) {
        youllGet += item.youGet;
        getPeople += 1;
      }
      if (item.youOwe && item.youOwe > 0) {
        youOwe += item.youOwe;
        owePeople += 1;
      }
    }

    return {
      youllGet: Math.round(youllGet * 100) / 100,
      youOwe: Math.round(youOwe * 100) / 100,
      getPeopleCount: getPeople,
      owePeopleCount: owePeople,
    };
  },

  /**
   * Immutably settles a split expense item.
   */
  settleItem(item: SplitItem): SplitItem {
    return {
      ...item,
      status: 'SETTLED',
      youGet: 0,
      youOwe: 0,
    };
  },

  /**
   * Clean fintech currency formatter (e.g. ₹12,345 or ₹45.50).
   */
  formatINR(amount: number): string {
    const isNegative = amount < 0;
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    });
    return `${isNegative ? '-' : ''}₹${formatted}`;
  },
};
